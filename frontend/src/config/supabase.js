import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Do not persist auth tokens in browser localStorage. The admin panel
// authenticates through the backend (/api/auth/login) and keeps only the
// short-lived access token in app state; leaving the Supabase client to
// auto-store access/refresh tokens in localStorage would expose them to XSS.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
