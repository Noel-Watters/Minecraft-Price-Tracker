import express from "express";
import { supabase } from "../config/supabaseClient.js"
import { protectRoute } from "../middleware/authMiddleWare.js";

const router = express.Router();
router.use(express.json())

function validatePayload(p) {
        const errors = [];
        const optStr = (v, k) => (!v || (typeof v === 'string' && v.trim()) ? null : `${k} required`);
        const needInt = (v, k) => (Number.isInteger(v) ? null : `${k} must be integer`);
        const needStr = (v, k) => (typeof v === 'string' && v.trim() ? null : `${k} required`);

        // required feilds
        [['name', needStr], ['owner', needStr], ['image', optStr]].forEach(([k, fn]) => {
                const e = fn(p[k], k); if (e) errors.push(e);
        });

        if (p['bounds'] && Array.isArray(p['bounds'])) {
                let bounds = p['bounds'];

                for (let i = 0; i < bounds.length; i++) {
                        // numeric coords 
                        ;['min_x', 'min_y', 'min_z',
                                'max_x', 'max_y', 'max_z'].forEach(k => {
                                        if (bounds[i][k] !== undefined) {
                                                const e = needInt(bounds[i][k], k); if (e) errors.push(e);
                                        }
                                });
                }
        }
        else {
                errors.push("bounds must be array");
        }
        return errors;
}

//Create shop in region by id
router.post("/regions/:id/shops", protectRoute, async (req, res) => {
        try {
                if (!req.user) {
                        console.log('No auth provided');
                        return res.status(401).json({ error: 'bad_request', details: 'No auth provided' });
                }

                const region_id = req.params.id;

                let b = req.body || {};

                const errs = validatePayload(b);
                if (errs.length) {
                        console.log('Validation errors:', errs);
                        return res.status(400).json({ error: 'bad_request', details: errs });
                }

                let center = { x: 0, y: 0, z: 0 };
                for (let i = 0; i < b.bounds.length; i++) {
                        center.x += (b.bounds[i].min_x + b.bounds[i].max_x) * 0.5;
                        center.y += (b.bounds[i].min_y + b.bounds[i].max_y) * 0.5;
                        center.z += (b.bounds[i].min_z + b.bounds[i].max_z) * 0.5;
                }

                center.x = Math.round(center.x * 1 / b.bounds.length);
                center.y = Math.round(center.y * 1 / b.bounds.length);
                center.z = Math.round(center.z * 1 / b.bounds.length);

                console.log(center);
                const { data: region_data, error: region_find_error } = await supabase.rpc('find_region_in_bounds', {
                        px: center.x,
                        py: center.y,
                        pz: center.z
                }).single();

                if (region_find_error) {
                        console.error('Unable to find region:', region_find_error);
                        return res.status(400).json({ error: 'bad_request', details: region_find_error });
                }

                if (region_id !== region_data.id) {
                        var err = `Region id mismatch, zone: ${region_data.id}, requested $(region_id)`;
                        console.error("Region match error: ", err)
                        return res.status(400).json({ error: 'bad_request', details: err });
                }

                if (!req.admin && !region_data.owners.includes(req.user.id)) {
                        var err = `User is not in region owners`;
                        console.error("Region auth error: ", err)
                        return res.status(400).json({ error: 'bad_request', details: err });
                }


                const formatted_bounds = b.bounds.map(
                        (bound) => `(${bound.min_x},${bound.min_y},${bound.min_z},${bound.max_x},${bound.max_y},${bound.max_z})`
                );

                const insertData = {
                        name: b.name,
                        owner: b.owner,
                        bounds: formatted_bounds,
                        region: region_data['id'],
                        has_floating: !!b.has_floating,
                        exchange_items: Array.isArray(b.exchange_items) ? b.exchange_items : []
                }

                if (b.image)
                        insertData.image = b.image;

                console.log('Attempting to insert:', JSON.stringify(insertData, null, 2));

                const { data: shop_data, error } = await supabase
                        .from('shops')
                        .insert(insertData)
                        .select().single();

                if (insertData.has_floating && Array.isArray(insertData.exchange_items)) {
                        for (const itemId of insertData.exchange_items) {
                                await supabase.from('floating_exchanges').insert({
                                        shop_id: shop_data.id,
                                        item_id: itemId,
                                        item_name: itemId,
                                        per_diamond: null,
                                        per_item: null
                                });
                        }
                }

                if (error) {
                        console.log('Database error:', error);
                        return res.status(500).json({ error: 'db_error', details: error.message });
                }

                console.log(shop_data);
                let current_region_shops = region_data['shops'] || [];

                current_region_shops = [...current_region_shops, shop_data.id];

                const { error: update_region_error } = await supabase
                        .from('regions')
                        .update({ ['shops']: current_region_shops })
                        .eq('id', region_data['id']);

                if (region_find_error) {
                        console.error('Unable to update region:', update_region_error);
                        return res.status(500).json({ error: 'bad_request', details: update_region_error });
                }

                console.log('Successfully inserted exchange data with name:', b.name);

                return res.status(201).json({ ok: true, id: shop_data.id });

        } catch (e) {
                console.error('ingest error', e);
                return res.status(500).json({ error: 'server_error' });
        }
});

//Get shops in region by id
router.get("/regions/:id/shops", protectRoute, async (req, res) => {
        try {
                if (!req.user) {
                        console.log('No auth provided');
                        return res.status(401).json({ error: 'bad_request', details: 'No auth provided' });
                }

                const region_id = req.params.id;

                let query = supabase
                        .from("regions")
                        .select("shops")
                        .eq('id', region_id);

                if (!req.admin)
                        query = query.contains('owners', [req.user.id]);

                query = query.single();

                const { data: region_data, error: region_error } = await query;
                if (region_error) {
                        console.error('Unable to find region:', region_error);
                        return res.status(500).json({ error: 'bad_request', details: region_error });
                }

                const { data: shops_data, error: shop_error } = await supabase
                        .from("shops")
                        .select("*")
                        .in('id', region_data.shops)
                        .order("index", { ascending: true });

                if (shop_error) {
                        console.error('Unable to find shop:', shop_error);
                        return res.status(500).json({ error: 'bad_request', details: shop_error });
                }

                return res.status(201).json({ ok: true, shops: shops_data });
        } catch (e) {
                console.error('ingest error', e);
                return res.status(500).json({ error: 'server_error' });
        }
});

function validateDeletePayload(p) {
        const errors = [];
        const needStr = (v, k) => (typeof v === 'string' && v.trim() ? null : `${k} required`);

        // required feilds
        [['shop_id', needStr]].forEach(([k, fn]) => {
                const e = fn(p[k], k); if (e) errors.push(e);
        });

        return errors;
}

router.delete("/regions/:id/shops", protectRoute, async (req, res) => {
        try {
                if (!req.user) {
                        console.log('No auth provided');
                        return res.status(401).json({ error: 'bad_request', details: 'No auth provided' });
                }


                const region_id = req.params.id;
                let b = req.body || {};

                validateDeletePayload(b);
                let query = supabase
                        .from("regions")
                        .select("shops")
                        .eq('id', region_id);

                if (!req.admin)
                        query = query.contains('owners', [req.user.id]);

                query = query.single();

                const { data: region_data, error: region_error } = await query;
                if (region_error) {
                        console.error('Unable to find region:', region_error);
                        return res.status(400).json({ error: 'bad_request', details: region_error });
                }

                if (!region_data.shops.includes(b.shop_id)) {
                        var err = `Unable to find shop: ${b.shop_id}`;
                        console.error(err);
                        return res.status(400).json({ error: 'bad_request', details: err });
                }

                const { error: shop_error } = await supabase
                        .from("shops")
                        .delete()
                        .eq('id', b.shop_id);

                if (shop_error) {
                        console.error('Unable to find shop:', shop_error);
                        return res.status(400).json({ error: 'bad_request', details: shop_error });
                }

                return res.status(201).json({ ok: true });
        } catch (e) {
                console.error('ingest error', e);
                return res.status(500).json({ error: 'server_error' });
        }
});

function validateUpdateShopPayload(p) {
        const errors = [];
        const optStr = (v, k) => (!v || (typeof v === 'string' && v.trim()) ? null : `${k} required`);
        const optInt = (v, k) => (Number.isInteger(v) ? null : `${k} must be integer`);

        const needInt = (v, k) => (Number.isInteger(v) ? null : `${k} must be integer`);
        const needStr = (v, k) => (typeof v === 'string' && v.trim() ? null : `${k} required`);

        // required feilds
        [['shop_id', needStr], ['name', optStr], ['owner', optStr], ['image', optStr]].forEach(([k, fn]) => {
                const e = fn(p[k], k); if (e) errors.push(e);
        });

        return errors;
}

//update shop in region by id
router.patch("/regions/:id/shops", protectRoute, async (req, res) => {
        try {
                if (!req.user) {
                        console.log('No auth provided');
                        return res.status(401).json({ error: 'bad_request', details: 'No auth provided' });
                }

                const region_id = req.params.id;
                let b = req.body || {};

                validateUpdateShopPayload(b);

                let query = supabase
                        .from("regions")
                        .select("shops")
                        .eq('id', region_id);

                if (!req.admin)
                        query = query.contains('owners', [req.user.id]);

                query = query.single();

                const { data: region_data, error: region_error } = await query;

                if (region_error) {
                        console.error('Unable to find region:', region_error);
                        return res.status(400).json({ error: 'bad_request', details: region_error });
                }

                if (!region_data.shops.includes(b.shop_id)) {
                        var err = `Unable to find shop: ${b.shop_id}`;
                        console.error(err);
                        return res.status(400).json({ error: 'bad_request', details: err });
                }

                let updateData = {};
                if (b.name)
                        updateData.name = b.name;
                if (b.owner)
                        updateData.owner = b.owner;
                if (b.image)
                        updateData.image = b.image;
                if (typeof b.has_floating === "boolean")
                        updateData.has_floating = b.has_floating;
                if (Array.isArray(b.exchange_items))
                        updateData.exchange_items = b.exchange_items;

                const { error: shop_error } = await supabase
                        .from("shops")
                        .update(updateData)
                        .eq('id', b.shop_id);

                if (shop_error) {
                        console.error('Shop update error:', shop_error);
                        return res.status(400).json({ error: 'bad_request', details: shop_error });
                }
                if (typeof b.has_floating === "boolean") {
                        await supabase.from('floating_exchanges').delete().eq('shop_id', b.shop_id);
                        if (b.has_floating && Array.isArray(b.exchange_items)) {
                                for (const itemId of b.exchange_items) {
                                        const { error } = await supabase.from('floating_exchanges').insert({
                                                shop_id: b.shop_id,
                                                item_id: itemId,
                                                item_name: itemId,
                                                per_diamond: null,
                                                per_item: null
                                        });
                                        if (error) console.error('Insert error:', error);
                                }
                        }
                }

                return res.status(201).json({ ok: true, id: b.shop_id });
        } catch (e) {
                console.error('ingest error', e);
                return res.status(500).json({ error: 'server_error' });
        }
});

function validateUpdateRegionPayload(p) {
        const errors = [];
        const optStr = (v, k) => (!v || (typeof v === 'string' && v.trim()) ? null : `${k} required`);
        const optInt = (v, k) => (Number.isInteger(v) ? null : `${k} must be integer`);

        const needInt = (v, k) => (Number.isInteger(v) ? null : `${k} must be integer`);
        const needStr = (v, k) => (typeof v === 'string' && v.trim() ? null : `${k} required`);

        // required feilds
        [['name', optStr], ['image', optStr]].forEach(([k, fn]) => {
                const e = fn(p[k], k); if (e) errors.push(e);
        });

        return errors;
}

//update region by id
router.patch("/regions/:id", protectRoute, async (req, res) => {
        try {
                if (!req.user) {
                        console.log('No auth provided');
                        return res.status(401).json({ error: 'bad_request', details: 'No auth provided' });
                }

                const region_id = req.params.id;
                let b = req.body || {};

                validateUpdateRegionPayload(b);

                let updateData = {};
                if (b.name)
                        updateData.name = b.name;
                if (b.image)
                        updateData.image = b.image;
            

                let query = supabase
                        .from("regions")
                        .update(updateData)
                        .eq('id', region_id);

                if (!req.admin)
                        query = query.contains('owners', [req.user.id]);

                query = query.single();

                const { error: region_error } = await query;

                if (region_error) {
                        console.error('Unable to find region:', region_error);
                        return res.status(400).json({ error: 'bad_request', details: region_error });
                }


                return res.status(201).json({ ok: true, id: region_id });
        } catch (e) {
                console.error('ingest error', e);
                return res.status(500).json({ error: 'server_error' });
        }
});

//Get all regions 
router.get("/regions", protectRoute, async (req, res) => {
        if (!req.user) {
                console.log('No auth provided');
                return res.status(401).json({ error: 'bad_request', details: 'No auth provided' });
        }

        let query = supabase
                .from("regions")
                .select("*")

        if (!req.admin)
                query = query.contains('owners', [req.user.id]);

        query = query.order("name", { ascending: false });

        const { data, error } = await query;

        if (error) return res.status(500).send(error.message);

        return res.status(200).json({ ok: true, regions: data });
});

router.get("/shops/:shopId/floating_exchanges", protectRoute, async (req, res) => {
    const { data, error } = await supabase
        .from("floating_exchanges")
        .select("*")
        .eq("shop_id", req.params.shopId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, floating_exchanges: data });
});

export { router };
