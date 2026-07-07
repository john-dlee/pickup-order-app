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
  item_notes: string | null;
};

type SnapshotItem = {
  menu_item_id: string;
  item_name: string;           // from db at checkout time
  quantity: number;
  unit_price_cents: number;    // from db at checkout time
  selections: Record<string, string>;  // {} for plain items
};

async function resolveItemNotes(
  selections: Record<string, string>
): Promise<string | null> {
  const entries = Object.entries(selections);
  if (!entries.length) return null;

  const optionIds = entries.map(([, optionId]) => optionId);
  const groupIds = entries.map(([groupId]) => groupId);

  const [{ data: opts }, { data: grps }] = await Promise.all([
    supabase.from("modifier_options").select("id, name").in("id", optionIds),
    supabase.from("modifier_groups").select("id, name").in("id", groupIds),
  ]);

  if (!opts?.length) return null;

  const parts = entries.map(([groupId, optionId]) => {
    const groupName = grps?.find((g) => g.id === groupId)?.name ?? "Option";
    const optionName = opts.find((o) => o.id === optionId)?.name ?? optionId;
    return `${groupName}: ${optionName}`;
  });

  return parts.join(", ");
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !endpointSecret) {
    return NextResponse.json({ error: "Missing configuration or signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  // Verify payload from Stripe
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

  const checkoutId = session.metadata?.checkout_id;

  if (!checkoutId) {
    console.error("Missing checkout_id on session", session.id);
    return NextResponse.json({ error: "Missing checkout_id" }, { status: 400 });
  }

  const { data: checkout, error: checkoutError } = await supabase
    .from("checkout_sessions")
    .select("*")
    .eq("id", checkoutId)
    .maybeSingle();

  if (checkoutError || !checkout) {
    console.error("Checkout session not found", checkoutId, checkoutError);
    return NextResponse.json({ error: "Checkout session not found" }, { status: 500 });
  }

  if (checkout.status === "completed") {
    return NextResponse.json({ received: true });
  }

  const customer_name = checkout.customer_name;
  const customer_phone = checkout.customer_phone;
  const items = checkout.items as SnapshotItem[];
  const accessories = checkout.accessories as { id: string; quantity: number }[];

  for (const item of items) {
    orderItemRows.push({
      menu_item_id: item.menu_item_id,
      item_name: item.item_name,
      unit_price_cents: item.unit_price_cents,
      quantity: item.quantity,
      is_accessory: false,
      item_notes: await resolveItemNotes(item.selections ?? {}),
    });
    totalCents += item.unit_price_cents * item.quantity;
  }

  for (const acc of accessories) {
    const defined = ACCESSORIES.find((a) => a.id === acc.id);

    if (!defined) {
      console.error("Accessory item missing at fulfillment", acc.id);
      return NextResponse.json({ error: "Accessory item not found" }, { status: 500 });
    }

    orderItemRows.push({
      menu_item_id: null,
      item_name: defined.name,
      unit_price_cents: defined.price_cents,
      quantity: acc.quantity,
      is_accessory: true,
      item_notes: null,
    });
    totalCents += defined.price_cents * acc.quantity;
  }

  const readyMinutes = 15;
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

  await supabase
    .from("checkout_sessions")
    .update({ status: "completed", order_id: order.id })
    .eq("id", checkoutId);

  console.log("Created order", order.id, "daily #", dailyNumber);

  return NextResponse.json({ received: true });
}