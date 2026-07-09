import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fulfillCheckoutSession, type SnapshotItem } from "@/lib/fulfill-checkout";
import { STALE_CHECKOUT_MINUTES } from "@/lib/checkout-constraints";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

const supabase = createSupabaseServerClient();

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

  if (checkout.status === "expired") {
    console.log("Checkout dismissed/expired, skipping fulfill", checkoutId);
    return NextResponse.json({ received: true });
  }

  const ageMinutes = (Date.now() - new Date(checkout.created_at).getTime()) / (1000 * 60);

  if (ageMinutes > STALE_CHECKOUT_MINUTES) {
    await supabase
      .from("checkout_sessions")
      .update({
        status: "needs_review",
        review_reason: `webhook delayed ${Math.floor(ageMinutes)}m`,
      })
      .eq("id", checkoutId);

    console.log("Stale checkout, needs review", checkoutId);
    return NextResponse.json({ received: true });
  }

  const result = await fulfillCheckoutSession({
    checkout: {
      id: checkout.id,
      customer_name: checkout.customer_name,
      customer_phone: checkout.customer_phone,
      items: checkout.items as SnapshotItem[],
      accessories: checkout.accessories as { id: string; quantity: number }[],
    },
    stripeSessionId: session.id,
  });

  if ("error" in result) {
    console.error("Fulfillment failed", result.error, checkoutId);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  console.log("Created order", result.orderId);
  return NextResponse.json({ received: true });
}