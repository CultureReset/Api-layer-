const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.GCR_SUPABASE_URL;
const supabaseKey = process.env.GCR_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('GCR_SUPABASE_URL and GCR_SUPABASE_SERVICE_KEY environment variables are required');
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

module.exports = db;
