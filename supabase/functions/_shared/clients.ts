import { createClient } from "npm:@supabase/supabase-js@2";

export const projectUrl = Deno.env.get("SUPABASE_URL") ?? "";
export const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!projectUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Supabase function environment is incomplete.");
}

export const adminClient = createClient(projectUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function userClient(token: string) {
  return createClient(projectUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
