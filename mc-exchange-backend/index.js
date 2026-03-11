import express from "express";
import { supabase } from "./config/supabaseClient.js";
import crypto from "crypto";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cron from "node-cron";
import axios from "axios";


function normalizeItemId(name) {
        if (!name) return null;
        return String(name).toLowerCase().trim().replace(/\s+/g, '_');
}

function validatePayload(p) {
        const errors = [];
        const needInt = (v, k) => (Number.isInteger(v) ? null : `${k} must be integer`);
        const needStr = (v, k) => (typeof v === 'string' && v.trim() ? null : `${k} required`);

        // required fields
        [['player', needStr], ['raw', needStr], ['dimension', needStr], ['exchange_present', needInt]].forEach(([k, fn]) => {
                const e = fn(p[k], k); if (e) errors.push(e);
        });

        // numeric coords 
        ;['x', 'y', 'z'].forEach(k => { if (p[k] !== undefined) { const e = needInt(p[k], k); if (e) errors.push(e); } });

        // quantities
        ;['input_qty', 'output_qty'].forEach(k => {
                const v = p[k];
                if (!(Number.isInteger(v) && v >= 0)) errors.push(`${k} must be integer >= 0`);
        });

        // items
        if (!p.input_item_id) errors.push('input_item_id required');
        if (!p.output_item_id) errors.push('output_item_id required');

        // exchange_possible (nullable allowed) - note: chat relay sends this field name
        if (p.exchange_possible !== null && p.exchange_possible !== undefined) {
                if (!Number.isInteger(p.exchange_possible) || p.exchange_possible < 0)
                        errors.push('exchange_possible must be integer >= 0 or null');
        }

        return errors;
}

function makeBlockHash(x, y, z, dimension, exchange_present) {
        return crypto.createHash('sha1').update(`${x}|${y}|${z}|${dimension}|${exchange_present}`).digest('hex');
}

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("tiny"));

import { router as owner_router } from "./routes/owner.routes.js";
import { router as admin_router } from "./routes/admin.routes.js";
import { router as user_router } from "./routes/user.routes.js";
import { adminProtectRoute, protectRoute } from "./middleware/authMiddleWare.js";
app.use("/owner", owner_router);
app.use("/admin", admin_router);
app.use("/user", user_router);

// simple hash for deduplication
function makeHash(raw) {
        const minute = Math.floor(Date.now() / 60000);
        return crypto.createHash("sha1").update(`${raw}|${minute}`).digest("hex");
}


async function upsertFloatingExchange(shop_id, b) {
    if (!shop_id) return;

    const { data: floatingExchanges, error: floatingError } = await supabase
        .from('floating_exchanges')
        .select('*')
        .eq('shop_id', shop_id);

    if (floatingError || !floatingExchanges || floatingExchanges.length <= 0)
        return;

    for (const fx of floatingExchanges) {
        if (
            fx.item_id !== b.input_item_id &&
            fx.item_id !== b.output_item_id
        )
            continue;

        // Recalculate rates using max/min over last 10 trades for this item/shop
        const { data: recentExchanges, error: recentError } = await supabase
            .from('exchanges')
            .select('*')
            .eq('shop', shop_id)
            .or(`input_item_id.eq.${fx.item_id},output_item_id.eq.${fx.item_id}`)
            .order('ts', { ascending: false })
            .limit(10);

        if (recentError || !recentExchanges || recentExchanges.length <= 0)
            continue;

        let maxPerDiamond = null;
        let minPerItem = null;
        for (const ex of recentExchanges) {
            if (ex.input_item_id === 'diamond' && ex.output_item_id === fx.item_id && ex.input_qty > 0) {
                const itemsPerDiamond = ex.output_qty / ex.input_qty;
                if (maxPerDiamond === null || itemsPerDiamond > maxPerDiamond) {
                    maxPerDiamond = itemsPerDiamond;
                }
            } else if (ex.input_item_id === fx.item_id && ex.output_item_id === 'diamond' && ex.output_qty > 0) {
                const itemsPerDiamond = ex.input_qty / ex.output_qty;
                if (minPerItem === null || itemsPerDiamond < minPerItem) {
                    minPerItem = itemsPerDiamond;
                }
            }
        }

        await supabase
            .from('floating_exchanges')
            .update({
                per_diamond: maxPerDiamond,
                per_item: minPerItem
            })
            .eq('id', fx.id);
    }
}


// POST /api/exchanges — endpoint for chat relay
app.post('/api/exchanges', async (req, res) => {
        try {
                const b = req.body || {};

                // DEBUG: Log the incoming request body
                console.log('Received exchange data:', JSON.stringify(b, null, 2));
                // Convert dimension from minecraft namespace to simple name
                if (b.dimension === 'minecraft:overworld') {
                        b.dimension = 'overworld';
                } else if (b.dimension === 'minecraft:the_nether') {
                        b.dimension = 'nether';
                } else if (b.dimension === 'minecraft:the_end') {
                        b.dimension = 'end';
                } else if (b.dimension && b.dimension.startsWith('minecraft:')) {
                        // Remove minecraft: prefix for any other dimensions
                        b.dimension = b.dimension.replace('minecraft:', '');
                }


                b.input_item_id = normalizeItemId(b.input_item_id);
                b.output_item_id = normalizeItemId(b.output_item_id);

                b.compacted_input = Boolean(b.compacted_input);
                b.compacted_output = Boolean(b.compacted_output);



                // validate
                const errs = validatePayload(b);
                if (errs.length) {
                        console.log('Validation errors:', errs);
                        return res.status(400).json({ error: 'bad_request', details: errs });
                }

                const { data: shop_data, error: shop_find_error } = await supabase.rpc('find_shop_in_bounds', {
                        px: b.x,
                        py: b.y,
                        pz: b.z
                }).single();

                let shop_id = null;
                if (!shop_find_error) {
                        shop_id = shop_data.id;
                }

                // build dedupe hash from the full block
                const hash_id = makeBlockHash(b.x, b.y, b.z, b.dimension, b.exchange_present);

                console.log('Generated hash_id:', hash_id);
                let kind = "trade";
                let price_d_per_unit = null;

                if (b.input_item_id === "diamond") {
                        kind = "sell";
                        if (b.output_qty && b.output_qty > 0) {
                                price_d_per_unit = b.input_qty / b.output_qty;
                        }
                } else if (b.output_item_id === "diamond") {
                        kind = "buy";
                        if (b.input_qty && b.input_qty > 0) {
                                price_d_per_unit = b.output_qty / b.input_qty;
                        }
                }

                // write (UPSERT on hash_id)
                const insertData = {
                        ts: new Date().toISOString(),
                        player: b.player,
                        x: b.x, y: b.y, z: b.z,
                        dimension: b.dimension,
                        loc_src: 'manual',
                        input_item_id: b.input_item_id,
                        input_qty: b.input_qty,
                        output_item_id: b.output_item_id,
                        output_qty: b.output_qty,
                        exchange_possible: (b.exchange_possible ?? null),
                        compacted_input: b.compacted_input,
                        compacted_output: b.compacted_output,
                        exchange_present: b.exchange_present,
                        raw: b.raw,
                        shop: shop_id,
                        hash_id,
                        kind,
                        price_d_per_unit
                };

                if (b.input_enchantments != null && Array.isArray(b.input_enchantments) && b.input_enchantments.every(element => typeof element === 'string'))
                        insertData.input_enchantments = b.input_enchantments;
                if (b.output_enchantments != null && Array.isArray(b.output_enchantments) && b.output_enchantments.every(element => typeof element === 'string'))
                        insertData.output_enchantments = b.output_enchantments;


                console.log('Attempting to insert:', JSON.stringify(insertData, null, 2));

                const { error } = await supabase
                        .from('exchanges')
                        .upsert(insertData, { onConflict: 'hash_id' })
                        .select();

                if (error) {
                        console.log('Database error:', error);
                        return res.status(500).json({ error: 'db_error', details: error.message });
                }

                if (shop_id) {
                        await upsertFloatingExchange(shop_id, b);
                }
                console.log('Successfully inserted exchange data with hash_id:', hash_id);

                return res.status(201).json({ ok: true, hash_id });
        } catch (e) {
                console.error('ingest error', e);
                return res.status(500).json({ error: 'server_error' });
        }
});

// GET /export.csv → export data
app.get("/export.csv", protectRoute, adminProtectRoute, async (_, res) => {
        const { data, error } = await supabase
                .from("exchanges")
                .select("*")
                .order("ts", { ascending: false });

        if (error) return res.status(500).send(error.message);

        const csv = [
                Object.keys(data[0] || {}).join(","),
                ...data.map(row =>
                        Object.values(row)
                                .map(v => (v === null ? "" : `"${String(v).replace(/"/g, '""')}"`))
                                .join(",")
                ),
        ].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=exchanges.csv");
        res.send(csv);
});

// Schedule to run every hour at minute 0
cron.schedule('0 * * * *', async () => {
        try {
                // Adjust the URL/port if needed
                await axios.post('http://localhost:8080/admin/update_market_prices');
                console.log("Market prices updated (scheduled)");
        } catch (e) {
                console.error("Scheduled market price update failed:", e.message);
        }
});


app.listen(process.env.PORT || 8080, '0.0.0.0', () => {
  console.log("Backend running on port", process.env.PORT || 8080);
});