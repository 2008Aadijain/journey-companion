// This file is maintained manually with environment validation.
// Update with care and ensure environment schema alignment.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { envSchema } from '@/lib/schemas';

const env = envSchema.parse(import.meta.env);

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});