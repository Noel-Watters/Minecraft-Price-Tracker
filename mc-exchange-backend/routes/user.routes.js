import express from "express";
import { supabase } from "../config/supabaseClient.js";

const router = express.Router();

//gets all regions or by slug
router.get("/regions", async (req, res) => {
  const { slug } = req.query;
  let query = supabase.from("regions").select("id, name, bounds, slug, shops");
  if (slug) query = query.eq("slug", slug);
  const { data, error } = await query.order("name", { ascending: false });
  if (error) return res.status(500).send(error.message);
  return res.status(200).json({ ok: true, regions: data });
});

router.get("/regions/:slug/shops", async (req, res) => {
  try {
    const region_slug = req.params.slug;
    let b = req.body || {};
    const { data: region_data, error: region_error } = await supabase
      .from("regions")
      .select("shops")
      .eq('slug', region_slug)
      .single();

    if (region_error) {
      console.error('Unable to find region:', region_error);
      return res.status(400).json({ error: 'bad_request', details: region_error });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const { data: shops_data, error: shop_error } = await supabase
      .from("shops")
      .select("id, name, created_at, owner, region, bounds, image, index, has_floating, exchange_items")
      .in('id', region_data.shops)
      .order("index", { ascending: true })
      .range (offset, offset + limit -1);

    if (shop_error) {
      console.error('Unable to find shop:', shop_error);
      return res.status(400).json({ error: 'bad_request', details: shop_error });
    }

    return res.status(201).json({ 
      ok: true, 
      shops: shops_data,
      pagination: {
        limit,
        offset,
        hasMore: shops_data.length === limit,
      }, 
    });
  } catch (e) {
    console.error('ingest error', e);
    return res.status(500).json({ error: 'server_error' });
  }
});

function validatePayload(p) {
  const errors = [];
  const needInt = (v, k) => (Number.isInteger(v) ? null : `${k} must be integer`);
  const needStr = (v, k) => (typeof v === 'string' && v.trim() ? null : `${k} required`);

  // required feilds
  [['shop', needStr]].forEach(([k, fn]) => {
    const e = fn(p[k], k); if (e) errors.push(e);
  });

  return errors;
}

router.get("/exchanges/shop", async (req, res) => {
  const shopId = req.query.shop;
  if (!shopId) {
    return res.status(400).json({ error: "Missing shop id" });
  }

  const { data: exchanges, error: exchangesError } = await supabase
    .from("exchanges")
    .select("ts, input_item_id, input_qty, output_item_id, output_qty, exchange_possible, compacted_input, compacted_output, shop(*), input_enchantments, output_enchantments, kind, price_d_per_unit")
    .eq('shop', shopId)
    .order("ts", { ascending: false });

  if (exchangesError) return res.status(500).send(exchangesError.message);

  const { data: floatingExchanges, error: floatingError } = await supabase
    .from("floating_exchanges")
    .select("*")
    .eq('shop_id', shopId);

  if (floatingError) return res.status(500).send(floatingError.message);

  // Filter out exchanges where one side is diamond and the other is a floating item
  const floatingItemIds = (floatingExchanges || []).map(fx => fx.item_id);

  const filteredExchanges = (exchanges || []).filter(ex =>
    !(
      (ex.input_item_id === "diamond" && floatingItemIds.includes(ex.output_item_id)) ||
      (ex.output_item_id === "diamond" && floatingItemIds.includes(ex.input_item_id))
    )
  );

  return res.status(200).json({
    ok: true,
    data: filteredExchanges,
    floating_exchanges: floatingExchanges || []
  });
});

router.get("/exchanges", async (req, res) => {
  try {
    const query_params = new URLSearchParams(req.query);
    const shopId = req.query.shop;
    let searchOutput = req.query.search_output;
    let sort_by = req.query.sort_by || "ts";
    let order = req.query.order || "descending";
    const regionSlugOrId = req.query.region;
    const compacted_filter = req.query.compacted || "";
    const input_enchant_filters = query_params.getAll("input_enchants");
    const output_enchant_filters = query_params.getAll("output_enchants");
    const avaliableOnly = req.query.available_only === 'true';

    if (!regionSlugOrId)
      return res.status(400).json({ error: "Missing region" });

    // If region is not a UUID, look up the UUID from the slug
    let regionId = regionSlugOrId;
    if (!/^[0-9a-fA-F-]{36}$/.test(regionSlugOrId)) {
      const { data: regionData, error: regionError } = await supabase
        .from("regions")
        .select("id")
        .eq("slug", regionSlugOrId)
        .single();
      if (regionError || !regionData) {
        return res.status(400).json({ error: "Invalid region slug" });
      }
      regionId = regionData.id;
    }

    if (!shopId && !searchOutput)
      return res.status(400).json({ error: "Missing shop id and search output" });

    let query = supabase
      .from("exchanges")
      .select("ts, input_item_id, input_qty, output_item_id, output_qty, exchange_possible, compacted_input, compacted_output, x, y, z, shop(*), input_enchantments, output_enchantments, kind, price_d_per_unit")
      .contains('input_enchantments', input_enchant_filters)
      .contains('output_enchantments', output_enchant_filters);

    if (avaliableOnly) {
      query = query.neq('exchange_possible', 0);
    }

    if (shopId)
      query = query.eq('shop.id', shopId);

    if (searchOutput) {
      query = query.ilike('output_item_id', `%${searchOutput.replace(/\s/g, '_')}%`);
    }

    if (compacted_filter === "both") {
      query.eq("compacted_input", true);
      query.eq("compacted_output", true);
    }
    else if (compacted_filter === "input")
      query.eq("compacted_input", true);
    else if (compacted_filter === "output")
      query.eq("compacted_output", true);

    if (order !== "ascending" && order !== "descending") {
      return res.status(400).json({ error: `Incorrect format for order` });
    }

    let ascending = order === "ascending";
    query = query.order(sort_by, { ascending });

    // Pagination
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

let limit = parseInt(req.query.limit, 10);
if (Number.isNaN(limit) || limit <= 0) {
  limit = DEFAULT_LIMIT;
}
if (limit > MAX_LIMIT) {
  limit = MAX_LIMIT;
}

let offset = parseInt(req.query.offset, 10);
if (Number.isNaN(offset) || offset < 0) {
  offset = 0;
}

const from = offset;
const to = offset + limit - 1;

const { data, error } = await query.range(from, to);

let hasMore = false;
if (data && data.length === limit) {
  // Check if there is at least one more row after this page
  const { data: next, error: nextError } = await query.range(to + 1, to + 1);
  hasMore = next && next.length > 0;
}


    if (error) {
      console.error('Database error in /user/exchanges:', error);
      return res.status(500).send(error.message);
    }

    return res.status(200).json({
  ok: true,
  data: data || [],
  pagination: {
    limit,
    offset,
    hasMore: (data || []).length === limit,
  },
});
  } catch (e) {
    console.error('unexpected error in /user/exchanges:', e);
    return res.status(500).json({ error: 'server_error' });
  }
});


function validateGetUserPayload(p) {
  const errors = [];
  const needStr = (v, k) => (typeof v === 'string' && v.trim() ? null : `${k} required`);

  // required feilds
  [['id', needStr]].forEach(([k, fn]) => {
    const e = fn(p[k], k); if (e) errors.push(e);
  });

  return errors;
}

router.get("/user", async (req, res) => {
  var b = req.body || {};

  validateGetUserPayload(b);

  const { data, error } = await supabase
    .from("users")
    .select("name")
    .eq('id', b.id)
    .single();

  if (error) return res.status(500).send(error.message);

  return res.status(201).json({ ok: true, data });
});

export { router };
