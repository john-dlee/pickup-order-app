import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function isAuthorised(request: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised"}, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, daily_order_number, customer_name, customer_phone, pickup_at, created_at")
    .eq("status", "active")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ error: "Failed to load orders"}, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}

export async function PATCH(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised"}, { status: 401 });
  }

  const { orderId } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId"}, { status: 400 });    
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ 
      status: "ready",
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId)
    .select()
    .single();
  
  if (error) {
    console.error("PATCH /api/admin/orders error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}