const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Warning: Supabase credentials not set. Database operations will fail.');
}

// Supabase client requires a valid URL — use a placeholder so the server can start without credentials
const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseServiceKey || '')
  : null;

module.exports = { supabase };
