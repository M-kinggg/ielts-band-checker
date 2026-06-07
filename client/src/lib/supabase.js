import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;

if (
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl === 'your_project_url' || 
  supabaseAnonKey === 'your_anon_key'
) {
  console.warn("WARNING: Supabase client env variables are not fully configured. Client database operations will be disabled.");
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase frontend client initialized successfully.");
  } catch (error) {
    console.error("Error initializing Supabase client:", error.message);
  }
}

export { supabase };
