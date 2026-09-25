import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("http") &&
  !supabaseUrl.includes("your-project")
);

// Client-side Supabase client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// Server-side admin client (with service role or anon key)
export const getServiceSupabase = () => {
  if (!isSupabaseConfigured) return null;
  return createClient(
    supabaseUrl!,
    supabaseServiceKey || supabaseAnonKey!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
};
