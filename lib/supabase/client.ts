import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createSupabaseClient() {
  return createClient<Database>(supabaseURL, supabaseAnonKey);
}