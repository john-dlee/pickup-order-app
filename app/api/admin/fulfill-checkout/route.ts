import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fulfillCheckoutSession, type SnapshotItem } from "@/lib/fulfill-checkout";
import { Database } from "@/lib/database.types";

const supabaseAdmin = createSupabaseServerClient();

export async function POST(request: Request) {
  // Verify admin is logged in
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized"}, { status: 401 });
  }

  const supabaseAuth = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse checkout_id
  let body: { checkout_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const checkoutId = body.checkout_id?.trim();
  if (!checkoutId) {
    return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
  }

  // Load checkout row
  const { data: checkout, error: checkoutError } = await supabaseAdmin
    .from("checkout_sessions")
    .select("*")
    .eq("id", checkoutId)
    .maybeSingle();

  if (checkoutError || !checkout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Idempotency
  if (checkout.status === "completed" && checkout.order_id) {
    return NextResponse.json({ ok: true, order_id: checkout.order_id });
  }
  
  const stripeSessionId = checkout.stripe_checkout_session_id;
  if (!stripeSessionId) {
    return NextResponse.json({ error: "No stripe session" }, { status: 400 });
  }
  
  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("stripe_checkout_session_id", stripeSessionId)
    .maybeSingle();
  
  if (existingOrder) {
    await supabaseAdmin
      .from("checkout_sessions")
      .update({ status: "completed", order_id: existingOrder.id })
      .eq("id", checkoutId);
    return NextResponse.json({ ok: true, order_id: existingOrder.id });
  }

  const result = await fulfillCheckoutSession({
    checkout: {
      id: checkout.id,
      customer_name: checkout.customer_name,
      customer_phone: checkout.customer_phone,
      items: checkout.items as SnapshotItem[],
      accessories: checkout.accessories as { id: string; quantity: number }[],
    },
    stripeSessionId,
  });

  if ("error" in result) {
    console.error("Manual fulfill failed", result.error, checkoutId);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, order_id: result.orderId });
}