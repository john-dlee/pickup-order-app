import { ACCESSORIES } from "@/lib/accessories";
import { normaliseAuMobile } from "@/lib/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

const supabase = createSupabaseServerClient();

type CheckoutItem = { id: string; quantity: number };
type CheckoutAccessory = { id: string; quantity: number };
type CheckoutBody = {
  name: string;
  phone: string;
  items: CheckoutItem[];
  accessories: CheckoutAccessory[];
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { name, phone, items = [], accessories = [] } = body as CheckoutBody;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!normaliseAuMobile(phone)) {
      return NextResponse.json({ error: "Valid phone is required" }, { status: 400 });
    }

    if (!items.length) {
      return NextResponse.json({ error: "Cart cannot be empty" }, { status: 400 });
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const clientAcc of accessories) {
      const validAccessory = ACCESSORIES.find((a) => a.id === clientAcc.id);
      if (!validAccessory) {
        return NextResponse.json({ error: `Invalid accessory ID: ${clientAcc.id}` }, { status: 400 });
      }
      if (!Number.isInteger(clientAcc.quantity) || clientAcc.quantity < 1) {
        return NextResponse.json({ error: "Invalid accessory quantity" }, { status: 400 });
      }
      if (clientAcc.quantity > validAccessory.maxQuantity) {
        return NextResponse.json(
          { error: `Max ${validAccessory.maxQuantity} for ${validAccessory.name}` },
          { status: 400 }
        );
      }
      if (validAccessory.price_cents > 0) {
        lineItems.push(toStripeLineItem(validAccessory.name, validAccessory.price_cents, clientAcc.quantity));
      }
    }

    const itemIds = items.map((i : CheckoutItem) => i.id);

    const { data: dbItems, error } = await supabase
      .from("menu_items")
      .select("id, name, price_cents")
      .in("id", itemIds);
    
    if (error || !dbItems) {
      return NextResponse.json({ error: "Failed to verify menu items"}, { status: 500 });
    }

    for (const clientItem of items) {
      const validItem = dbItems.find((db) => db.id === clientItem.id)
      if (!validItem) {
        return NextResponse.json({ error: `Item ${clientItem.id} not found`}, { status: 400 });
      }
      if (!Number.isInteger(clientItem.quantity) || clientItem.quantity < 1) {
        return NextResponse.json({ error: "Invalid item quantity" }, { status: 400 });    
      }
      if (clientItem.quantity > 20) {
        return NextResponse.json({ error: "Quantity too high" }, { status: 400 });
      }
      lineItems.push(toStripeLineItem(validItem.name, validItem.price_cents, clientItem.quantity));
    }
    

    const totalCents = lineItems.reduce(
      (sum, li) => sum + (li.price_data?.unit_amount ?? 0) * (li.quantity ?? 0),
      0
    );

    if (lineItems.length === 0 || totalCents <= 0) {
      return NextResponse.json({ error: "Invalid order total"}, { status: 400});
    }

    const normalisedPhone = normaliseAuMobile(phone)!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const session = await stripe.checkout.sessions.create({
      success_url: `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      line_items: lineItems,
      mode: "payment",
      metadata: {
        customer_name: name.trim(),
        customer_phone: normalisedPhone,
        items_json: JSON.stringify(items),
        accessories_json: JSON.stringify(accessories),
      },
    })
    
    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });

  } catch(err) {
    console.log(err);
    return NextResponse.json({ error: "Checkout failed. Please try again." }, { status: 500 });
  }
}

function toStripeLineItem(name: string, unitAmountCents: number, quantity: number) {
  return {
    quantity,
    price_data: {
      currency: "aud" as const,
      unit_amount: unitAmountCents,
      product_data: { name },
    },
  };
}