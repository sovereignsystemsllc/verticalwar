import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Shared storage base — import this instead of hardcoding Supabase URLs
export const SUPABASE_STORAGE_BASE = `${supabaseUrl}/storage/v1/object/public`;
