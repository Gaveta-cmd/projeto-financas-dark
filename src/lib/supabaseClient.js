import { createClient } from '@supabase/supabase-js';

// Strip trailing path segments so createClient gets the project root URL
const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
