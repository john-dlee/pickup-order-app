import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

export function createSupabaseServerClient() {
  return createClient<Database>(supabaseURL, supabaseSecretKey);
}