const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (
  !supabaseUrl || 
  !supabaseServiceKey || 
  supabaseUrl === 'your_project_url' || 
  supabaseServiceKey === 'your_service_role_key'
) {
  console.warn("WARNING: Supabase backend env variables are not fully configured. Database saves will be bypassed.");
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase backend client initialized successfully.");
  } catch (error) {
    console.error("Error initializing Supabase backend client:", error.message);
  }
}

module.exports = { supabase };
