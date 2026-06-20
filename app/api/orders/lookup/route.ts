import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("orders")
    .select("daily_order_number, pickup_at, customer_name, status")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}