import express from "express";
import { supabase } from "../config/supabaseClient.js";
import { adminProtectRoute, protectRoute } from "../middleware/authMiddleWare.js";

const router = express.Router();

// Download all shop events as JSON
router.get("/exchanges", protectRoute, adminProtectRoute, async (req, res) => {
  const shopId = req.query.shop;
  let searchOutput = req.query.search_output;
  const regionId = req.query.region;

  let query = supabase
    .from("exchanges")
    .select("ts, input_item_id, input_qty, output_item_id, output_qty, exchange_possible, compacted_input, compacted_output, x, y, z, shop(*), input_enchantments, output_enchantments, kind, price_d_per_unit");

  if (shopId)
    query = query.eq('shop.id', shopId);

  if (searchOutput) {
    searchOutput = '%' + searchOutput + '%';
    query = query.ilike('output_item_id', searchOutput);
  }

  if (regionId) query = query.eq('shop.region', regionId);

  const { data, error } = await query;

  if (error) return res.status(500).send(error.message);

  return res.status(201).json({ ok: true, data });
});

// Get all regions as JSON
router.get("/regions", protectRoute, adminProtectRoute, async (req, res) => {
  const { data, error } = await supabase
    .from("regions")
    .select("*")
    .order("name", { ascending: false });

  if (error) return res.status(500).send(error.message);

  return res.status(201).json({ ok: true, data });
});

function validateRegionCreatePayload(p) {
  const errors = [];
  const needStr = (v, k) => (typeof v === 'string' && v.trim() ? null : `${k} required`);
  const needInt = (v, k) => (Number.isInteger(v) ? null : `${k} must be integer`);

  // required feilds
  [['name', needStr], ['slug', needStr], ['dimension', needStr]].forEach(([k, fn]) => {
    const e = fn(p[k], k); if (e) errors.push(e);
  });

  if (!p['bounds']) {
    errors.push("bounds required");

    return errors;
  }


  if (Array.isArray(p['bounds'])) {
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


router.post("/regions", protectRoute, adminProtectRoute, async (req, res) => {
  var b = req.body || {};

  let errs = validateRegionCreatePayload(b);
  if (errs.length) {
    console.log('Validation errors:', errs);
    return res.status(400).json({ error: 'bad_request', details: errs });
  }

  const formatted_bounds = b.bounds.map(
    (bound) => `(${bound.min_x},${bound.min_y},${bound.min_z},${bound.max_x},${bound.max_y},${bound.max_z})`
  );

  const insertData = {
    name: b.name,
    slug: b.slug,
    dimension: b.dimension,
    bounds: formatted_bounds
  }

  console.log('Attempting to insert:', JSON.stringify(insertData, null, 2));

  const { error } = await supabase
    .from('regions')
    .insert(insertData)
    .select();

  if (error) {
    console.log('Database error:', error);
    return res.status(500).json({ error: 'db_error', details: error.message });
  }

  console.log('Successfully inserted region data data');

  return res.status(201).json({ ok: true });
});

function validatePatchRegionPayload(p) {
  const errors = [];
  const optStr = (v, k) => (typeof v === 'string' && v.trim() ? null : `${k} required`);
  const optArr = (v, k) => (Array.isArray(v) ? null : `${k} must be array`);
  const optInt = (v, k) => (Number.isInteger(v) ? null : `${k} must be integer`);

  // required fields
  [['name', optStr], ['slug', optStr], ['dimension', optStr]].forEach(([k, fn]) => {
    const e = fn(p[k], k); if (e) errors.push(e);
  });

  const ownersErr = optArr(p['owners'], 'owners');
  if (ownersErr) errors.push(ownersErr);

  if (!p['bounds'])
    return errors;

  if (Array.isArray(p['bounds'])) {
    let bounds = p['bounds'];
    for (let i = 0; i < bounds.length; i++) {
      // numeric coords 
      ['min_x', 'min_y', 'min_z',
        'max_x', 'max_y', 'max_z'].forEach(k => {
          if (bounds[i][k] !== undefined) {
            const e = optInt(bounds[i][k], k); if (e) errors.push(e);
          }
        });
    }
  }
  else {
    errors.push("bounds must be array");
  }

  return errors;
}

router.patch("/regions/:id", protectRoute, adminProtectRoute, async (req, res) => {
  const id = req.params.id;
  const b = req.body || {};

  var errs = validatePatchRegionPayload(b);
  if (errs.length) {
    console.log('Validation errors:', errs);
    return res.status(400).json({ error: 'bad_request', details: errs });
  }

  let insertData = {};

  if (b.name)
    insertData['name'] = b.name;

  if (b.slug)
    insertData['slug'] = b.slug;

  if (b.dimension)
    insertData['dimension'] = b.dimension;

  if (b.owners)
    insertData['owners'] = b.owners;

  if (b.bounds) {
    const formatted_bounds = b.bounds.map(
      (bound) => `(${bound.min_x},${bound.min_y},${bound.min_z},${bound.max_x},${bound.max_y},${bound.max_z})`
    );
    insertData['bounds'] = formatted_bounds;
  }

  const { error } = await supabase.from('regions').update(insertData).eq('id', id);

  if (error) {
    console.log('Database error:', error);
    return res.status(500).json({ error: 'db_error', details: error.message });
  }

  console.log('Successfully updated region data id:', id);

  return res.status(201).json({ ok: true, id });
})

router.delete("/regions/:id", protectRoute, adminProtectRoute, async (req, res) => {
  const id = req.params.id;
  const { error } = await supabase.from('regions').delete().eq('id', id);

  if (error) {
    console.log('Database error:', error);
    return res.status(500).json({ error: 'db_error', details: error.message });
  }

  return res.status(201).json({ ok: true, id });
});

async function getHalfDayCount() {
  var date = new Date();
  date.setHours(date.getHours() - 12);
  var half_day_ts = date.toISOString();
  const { data, error } = await supabase
    .from("exchanges")
    .select(
      "ts"
    )
    .gte("ts", half_day_ts);

  if (error) return res.status(500).send(error.message);
  return data.length;
}

async function getTotal() {
  const { data, error } = await supabase
    .from("exchanges")
    .select(
      "*"
    );

  if (error) return res.status(500).send(error.message);
  return data.length;
}

router.get("/stats", protectRoute, adminProtectRoute, async (_, res) => {
  let data = { total: await getTotal(), halfday: await getHalfDayCount() };

  return res.status(201).json({ ok: true, data });
})

router.get("/users", protectRoute, adminProtectRoute, async (req, res) => {
  let b = req.body || {};

  let page = 1;
  if (b['page'] && Number.isInteger(b['page']))
    page = b['page'];

  let per_page = 1;
  if (b['per_page'] && Number.isInteger(b['per_page']))
    per_page = b['per_page'];


  const { data: { users }, auth_error } = await supabase.auth.admin.listUsers({
    page,
    perPage: per_page,
  });

  if (auth_error) {
    console.error('error getting auth users:', auth_error.message);
    return res.status(500).send(auth_error.message);
  }

  console.log('All users:', users);

  return res.status(201).json({ ok: true, users });
});

function validatePatchUserPayload(p) {
  const errors = [];
  const optStr = (v, k) => (!v || (typeof v === 'string' && v.trim()) ? null : `${k} required`);
  const optInt = (v, k) => (Number.isInteger(v) ? null : `${k} must be integer`);

  // required feilds
  [['name', optStr], ['role', optStr]].forEach(([k, fn]) => {
    const e = fn(p[k], k); if (e) errors.push(e);
  });
  return errors;
}

router.patch("/users/:id", protectRoute, adminProtectRoute, async (req, res) => {
  var b = req.body || {};

  const id = req.params.id;


  var errs = validatePatchUserPayload(b);
  if (errs.length) {
    console.log('Validation errors:', errs);
    return res.status(400).json({ error: 'bad_request', details: errs });
  }

  let updateData = {};
  if (b.name)
    updateData['name'] = b.name;

  if (b.role)
    updateData['role'] = b.role;

  const { error } = supabase.from('users').update(updateData).eq('id', id).single();
  if (error) {
    console.log('Error updating user: ', error.message);
    return res.status(500).json({ error: 'db_error', details: error.message });
  }

  return res.status(201).json({ ok: true, id });

});

//Market Price Update Endpoint
router.post('/update_market_prices', async (req, res) => {
    try {
        const { region } = req.body || {};

        // Build base query
        let baseQuery = supabase
            .from('exchanges')
            .select('output_item_id, region')
            .neq('output_item_id', 'diamond')
            .neq('kind', 'trade')
            .neq('exchange_present', 0);

        if (region) {
            baseQuery = baseQuery.eq('region', region);
        }

        const { data: items, error: itemsError } = await baseQuery;

        if (itemsError) throw itemsError;

        const uniqueItems = [...new Set(items.map(row => row.output_item_id))];

        for (const item_id of uniqueItems) {
            // Add region filter to each query if region is specified
            let sellQuery = supabase
                .from('exchanges')
                .select('price_d_per_unit, output_qty')
                .eq('output_item_id', item_id)
                .eq('kind', 'sell')
                .eq('exchange_present', 1)
                .order('price_d_per_unit', { ascending: true })
                .limit(1);
            if (region) sellQuery = sellQuery.eq('region', region);

            let buyQuery = supabase
                .from('exchanges')
                .select('price_d_per_unit, input_qty')
                .eq('output_item_id', item_id)
                .eq('kind', 'buy')
                .eq('exchange_present', 1)
                .order('price_d_per_unit', { ascending: false })
                .limit(1);
            if (region) buyQuery = buyQuery.eq('region', region);

            let sellStockQuery = supabase
                .from('exchanges')
                .select('output_qty')
                .eq('output_item_id', item_id)
                .eq('kind', 'sell')
                .eq('exchange_present', 1);
            if (region) sellStockQuery = sellStockQuery.eq('region', region);

            let buyStockQuery = supabase
                .from('exchanges')
                .select('input_qty')
                .eq('output_item_id', item_id)
                .eq('kind', 'buy')
                .eq('exchange_present', 1);
            if (region) buyStockQuery = buyStockQuery.eq('region', region);

            const [
                { data: sell, error: sellError },
                { data: buy, error: buyError },
                { data: sellStock, error: sellStockError },
                { data: buyStock, error: buyStockError }
            ] = await Promise.all([sellQuery, buyQuery, sellStockQuery, buyStockQuery]);

            if (sellError || buyError || sellStockError || buyStockError) {
                throw sellError || buyError || sellStockError || buyStockError;
            }

            const best_sell_d = sell?.[0]?.price_d_per_unit ?? null;
            const best_buy_d = buy?.[0]?.price_d_per_unit ?? null;
            const sell_exchanges_available = sellStock ? sellStock.reduce((sum, row) => sum + (row.output_qty || 0), 0) : 0;
            const buy_exchanges_available = buyStock ? buyStock.reduce((sum, row) => sum + (row.input_qty || 0), 0) : 0;

            // Upsert into current_market_price
            await supabase
                .from('current_market_price')
                .upsert({
                    item_id,
                    best_sell_d,
                    best_buy_d,
                    sell_exchanges_available,
                    buy_exchanges_available,
                    updated_at: new Date().toISOString(),
                    region: region || null
                }, { onConflict: 'item_id' });
        }

        res.json({ ok: true, updated: uniqueItems.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'server_error', details: e.message });
    }
});

export { router };
