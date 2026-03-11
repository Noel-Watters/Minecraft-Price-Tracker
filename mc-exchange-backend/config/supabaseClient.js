import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();
console.log('ENV check:',
  'URL?', !!process.env.SUPABASE_URL,
  'SR KEY?', !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  'SR prefix:', (process.env.SUPABASE_SERVICE_ROLE_KEY || '').slice(0, 10)
);

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

export const supabase = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})
