import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACCESSORIES } from "@/lib/accessories";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

const supabase = createSupabaseServerClient();

type OrderItemRow = { 
  menu_item_id: string | null;
  item_name: string;
  unit_price_cents: number;
  quantity: number;
  is_accessory: boolean;
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !endpointSecret) {
    return NextResponse.json({ error: "Missing configuration or signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  // verify payload from Stripe
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  }
  catch(err) {
    return NextResponse.json({ error: "Webhook error"}, { status: 500 });
  }

  console.log("Stripe event:", event.type);

  // Ignore event types we don't care about but acknowledge
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Only move on if paid
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const orderItemRows: OrderItemRow[] = [];
  let totalCents = 0;

  // Idempotency — Stripe may resend the same event; one session = one order
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existing) {
    console.log("order already exists for session", session.id);
    return NextResponse.json({ received: true });
  }

  const { customer_name, customer_phone, items_json, accessories_json } = session.metadata ?? {};
  
  if (!customer_name || !customer_phone || !items_json) {
    console.error("Missing metadata on session", session.id);
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const items = JSON.parse(items_json) as { id: string; quantity: number }[];
  const accessories = JSON.parse(accessories_json ?? "[]") as { id: string; quantity: number }[];
  
  // get prices from db, don't trust metadata/client
  const itemIds = items.map((i) => i.id);
  const { data: dbItems, error: menuError} = await supabase
    .from("menu_items")
    .select("id, name, price_cents, requires_cooking")
    .in("id", itemIds);

  if (menuError || !dbItems?.length) {
    console.error("Menu lookup failed", menuError);
    return NextResponse.json({ error: "Menu lookup failed" }, { status: 500 });
  }

  for (const item of items) {
    const dbItem = dbItems.find((d) => d.id === item.id);
    if (!dbItem) continue; // or return 400
    orderItemRows.push({
      menu_item_id: dbItem.id,
      item_name: dbItem.name,
      unit_price_cents: dbItem.price_cents,
      quantity: item.quantity,
      is_accessory: false,
    });
    totalCents += dbItem.price_cents * item.quantity;
  }

  for (const acc of accessories) {
    const defined = ACCESSORIES.find((a) => a.id === acc.id);
    if (!defined) continue;
    orderItemRows.push({
      menu_item_id: null,
      item_name: defined.name,
      unit_price_cents: defined.price_cents,
      quantity: acc.quantity,
      is_accessory: true,
    });
    totalCents += defined.price_cents * acc.quantity;
  }

  // Check if order requires extra prep time
  const hasHotFood = items.some((item) => {
    const dbItem = dbItems.find((d) => d.id === item.id);
    return dbItem?.requires_cooking === true;
  })

  const readyMinutes = hasHotFood ? 20 : 10;
  const pickupAt = new Date(Date.now() + readyMinutes * 60 * 1000).toISOString();

  const orderDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  
  const { data: dailyNumber, error: rpcError } = await supabase.rpc(
    "next_daily_order_number",
    { p_date: orderDate}
  );

  if (rpcError || dailyNumber == null) {
    console.error("RPC failed", rpcError);
    return NextResponse.json({ error: "order number failed" }, { status: 500 });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name,
      customer_phone,
      payment_status: "paid",
      status: "active",
      total_cents: totalCents,
      stripe_checkout_session_id: session.id,
      order_date: orderDate,
      daily_order_number: dailyNumber,
      pickup_at: pickupAt,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("Order insert failed", orderError);
    return NextResponse.json({ error: "Order insert failed" }, { status: 500 });
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItemRows.map((row) => ({ ...row, order_id: order.id }))
  );

  if (itemsError) {
    console.error("Order items insert failed", itemsError);
    return NextResponse.json({ error: "Order items failed" }, { status: 500 });
  }

  console.log("Created order", order.id, "daily #", dailyNumber);

  return NextResponse.json({ received: true });
}