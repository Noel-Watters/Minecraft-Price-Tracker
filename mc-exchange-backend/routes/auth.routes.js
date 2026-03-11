import express from "express";
import { supabase } from "../config/supabaseClient.js";
import { protectRoute } from "../middleware/authMiddleWare.js";

const router = express.Router();

function validatePayload(p) {
  const errors = [];
  const needStr = (v, k) => (typeof v === 'string' && v.trim() ? null : `${k} required`);
  const needInt = (v, k) => (Number.isInteger(v) ? null : `${k} must be integer`);

  // required feilds
  [['name', needStr]].forEach(([k, fn]) => {
    const e = fn(p[k], k); if (e) errors.push(e);
  });

  return errors;
}

router.post("/name", protectRoute, async (req, res) => {
  try {
    if (!req.user) {
      console.log('No auth provided');
      return res.status(401).json({ error: 'bad_request', details: 'No auth provided' });
    }

    var b = req.body || {};

    validatePayload(b);

    const { error } = supabase.from('users').upsert({
      id: req.user.id,
      name: b.name
    }).select('*');

    if (error) {
      console.log('Unable to update/insert user');
      return res.status(401).json({ error: 'bad_request', details: 'Unable to update/insert user' });
    }
  } catch (e) {
    console.error('ingest error', e);
    return res.status(500).json({ error: 'server_error' });
  }
});
