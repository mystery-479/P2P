import { createClient } from "@supabase/supabase-js";

const projectUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(projectUrl && publishableKey);

/**
 * The browser must only receive a publishable/legacy anon key. Never put a
 * Supabase secret/service-role key in a VITE_ variable.
 */
export const supabase = supabaseConfigured
  ? createClient(projectUrl, publishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
