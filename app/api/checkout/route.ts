import { ACCESSORIES } from "@/lib/accessories";
import { normaliseAuMobile } from "@/lib/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { MAX_DISTINCT_MENU_ITEMS } from "@/lib/cart-limits";
import { isStoreOpenNow } from "@/lib/store-hours";

const supabase = createSupabaseServerClient();

type CheckoutItem = {
  id: string;
  quantity: number;
  selections?: Record<string, string>;
  selectionLabels?: Record<string, string>;
};
type CheckoutAccessory = { id: string; quantity: number };
type CheckoutBody = {
  name: string;
  phone: string;
  email: string;
  items: CheckoutItem[];
  accessories: CheckoutAccessory[];
};
type SnapshotItem = {
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price_cents: number;
  selections: Record<string, string>;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

function formatSelectionSummary(labels?: Record<string, string>): string | null {
  if (!labels || !Object.keys(labels).length) return null;
  return Object.values(labels).join(", ");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { name, phone, email, items = [], accessories = [] } = body as CheckoutBody;
    const [settingsRes, hoursRes] = await Promise.all([
      supabase.from("store_settings").select("is_open").single(),
      supabase
        .from("store_hours")
        .select("day_of_week, open_time, close_time, is_closed")
        .order("day_of_week"),
    ]);
    
    if (settingsRes.error || hoursRes.error || !settingsRes.data) {
      return NextResponse.json(
        { error: "Unable to check store hours. Please try again later." },
        { status: 503 }
      );
    }

    if (!hoursRes.data?.length) {
      return NextResponse.json(
        { error: "Unable to check store hours. Please try again later." },
        { status: 503 }
      );
    }

    if (!isStoreOpenNow(settingsRes.data, hoursRes.data)) {
      return NextResponse.json(
        { error: "We're currently closed. Please order during opening hours." },
        { status: 403 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!normaliseAuMobile(phone)) {
      return NextResponse.json({ error: "Valid phone is required" }, { status: 400 });
    }

    const trimmedEmail = email?.trim();

    if (!trimmedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!items.length) {
      return NextResponse.json({ error: "Cart cannot be empty" }, { status: 400 });
    }

    if (items.length > MAX_DISTINCT_MENU_ITEMS) {
      return NextResponse.json(
        { error: `Max ${MAX_DISTINCT_MENU_ITEMS} different items per order` }, 
        { status: 400 }
      );      
    }

    const lineItems: ReturnType<typeof toStripeLineItem>[] = [];

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
      .select("id, name, price_cents, is_available")
      .in("id", itemIds);
    
    const { data: links } = await supabase
      .from("menu_item_modifier_groups")
      .select("menu_item_id, group_id")
      .in("menu_item_id", itemIds);
    
    const groupIds = [...new Set((links ?? []).map((l) => l.group_id))];
    
    const { data: groups } = groupIds.length
      ? await supabase
          .from("modifier_groups")
          .select("id, required")
          .in("id", groupIds)
      : { data: [] };
    
    const { data: options } = groupIds.length
      ? await supabase
          .from("modifier_options")
          .select("id, group_id")
          .in("group_id", groupIds)
      : { data: [] };

    const requiredGroupIds = new Set(groups?.filter((g) => g.required).map((g) => g.id));
    
    // menuItemId → required group ids
    const requiredGroupsByItem = new Map<string, string[]>();
    for (const link of links ?? []) {
      if (!requiredGroupIds.has(link.group_id)) continue;
      const list = requiredGroupsByItem.get(link.menu_item_id) ?? [];
      list.push(link.group_id);
      requiredGroupsByItem.set(link.menu_item_id, list);
    }
    
    if (error || !dbItems) {
      return NextResponse.json({ error: "Failed to verify menu items"}, { status: 500 });
    }

    const snapshotItems: SnapshotItem[] = [];

    for (const clientItem of items) {
      const validItem = dbItems.find((db) => db.id === clientItem.id)
      if (!validItem) {
        return NextResponse.json({ error: `Item ${clientItem.id} not found`}, { status: 400 });
      }
      if (!validItem.is_available) {
        return NextResponse.json({ error: `${validItem.name} is sold out` }, { status: 400 });
      }
      if (!Number.isInteger(clientItem.quantity) || clientItem.quantity < 1) {
        return NextResponse.json({ error: "Invalid item quantity" }, { status: 400 });    
      }
      if (clientItem.quantity > 20) {
        return NextResponse.json({ error: "Quantity too high" }, { status: 400 });
      }
      
      const required = requiredGroupsByItem.get(clientItem.id) ?? [];
      const selections = clientItem.selections ?? {};

      for (const groupId of required) {
        const optionId = selections[groupId];
        if (!optionId) {
          return NextResponse.json(
            { error: `${validItem.name} requires a base selection` },
            { status: 400 }
          );
        }
        const validOption = options?.find(
          (o) => o.id === optionId && o.group_id === groupId
        );
        if (!validOption) {
          return NextResponse.json({ error: "Invalid modifier selection" }, { status: 400 });
        }
      }

      // plain items with extra junk selections — reject unknown options
      for (const [groupId, optionId] of Object.entries(selections)) {
        const linked = links?.some(
          (l) => l.menu_item_id === clientItem.id && l.group_id === groupId
        );
        if (!linked) {
          return NextResponse.json({ error: "Invalid modifier selection" }, { status: 400 });
        }
        const validOption = options?.find(
          (o) => o.id === optionId && o.group_id === groupId
        );
        if (!validOption) {
          return NextResponse.json({ error: "Invalid modifier selection" }, { status: 400 });
        }
      }

      snapshotItems.push({
        menu_item_id: validItem.id,
        item_name: validItem.name,
        quantity: clientItem.quantity,
        unit_price_cents: validItem.price_cents,
        selections: clientItem.selections ?? {},
      });


      const summary = formatSelectionSummary(clientItem.selectionLabels);
      const stripeName = summary ? `${validItem.name} (${summary})` : validItem.name;

      lineItems.push(toStripeLineItem(stripeName, validItem.price_cents, clientItem.quantity));
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

    const { data: checkout, error: checkoutError } = await supabase
      .from("checkout_sessions")
      .insert({
        customer_name: name.trim(),
        customer_phone: normalisedPhone,
        customer_email: trimmedEmail,
        items: snapshotItems,
        accessories,
        total_cents: totalCents,
        status: "pending",
      })
      .select("id")
      .single();

    if (checkoutError || !checkout) {
      console.error("checkout_sessions insert failed", checkoutError);
      return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      success_url: `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      line_items: lineItems,
      mode: "payment",
      customer_email: trimmedEmail,
      metadata: {
        checkout_id: checkout.id,
      },
    });
    
    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    await supabase
      .from("checkout_sessions")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", checkout.id);
      
    return NextResponse.json({ url: session.url });

  } catch(err) {
    console.log(err);
    return NextResponse.json({ error: "Checkout failed. Please try again later." }, { status: 500 });
  }
}