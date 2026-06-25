import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserClient: SupabaseClient<Database> | undefined;

// Singleton Pattern
export function createSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient<Database>(supabaseURL, supabaseAnonKey);
  }
  return browserClient;
}