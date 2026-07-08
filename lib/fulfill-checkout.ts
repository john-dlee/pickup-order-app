import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACCESSORIES } from "@/lib/accessories";

const supabase = createSupabaseServerClient();

export type SnapshotItem = {
  menu_item_id: string;
  item_name: string;           // from db at checkout time
  quantity: number;
  unit_price_cents: number;    // from db at checkout time
  selections: Record<string, string>;  // {} for plain items
};

type OrderItemRow = {
  menu_item_id: string | null;
  item_name: string;
  unit_price_cents: number;
  quantity: number;
  is_accessory: boolean;
  item_notes: string | null;
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

export async function fulfillCheckoutSession(params: {
  checkout: {
    id: string;
    customer_name: string;
    customer_phone: string;
    items: SnapshotItem[];
    accessories: { id: string; quantity: number }[];
  };
  stripeSessionId: string;
}): Promise<{ orderId: string } | { error: string }> {
  const { checkout, stripeSessionId } = params;

  const customer_name = checkout.customer_name;
  const customer_phone = checkout.customer_phone;
  const items = checkout.items;
  const accessories = checkout.accessories;

  const orderItemRows: OrderItemRow[] = [];
  let totalCents = 0;

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
      return { error: `Accessory not found: ${acc.id}` };
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

  let order: { id: string } | null = null;
  let orderError: unknown = null;
  const maxInsertAttempts = 3;

  for (let attempt = 1; attempt <= maxInsertAttempts; attempt++) {
    const { data: dailyNumber, error: rpcError } = await supabase.rpc(
      "next_daily_order_number",
      { p_date: orderDate }
    );

    if (rpcError || dailyNumber == null) {
      return { error: "order number failed" };
    }

    const insertRes = await supabase
      .from("orders")
      .insert({
        customer_name,
        customer_phone,
        payment_status: "paid",
        status: "active",
        total_cents: totalCents,
        stripe_checkout_session_id: stripeSessionId,
        order_date: orderDate,
        daily_order_number: dailyNumber,
        pickup_at: pickupAt,
      })
      .select("id")
      .single();

    order = insertRes.data;
    orderError = insertRes.error;

    if (!orderError && order) break;

    const code = (orderError as { code?: string } | null)?.code;
    if (code !== "23505") {
      return { error: "order insert failed" };
    }
    if (attempt === maxInsertAttempts) {
      return { error: "order insert failed after retries" };
    }
  }

  if (orderError || !order) {
    return { error: "order insert failed" };
  }
  
  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItemRows.map((row) => ({ ...row, order_id: order.id }))
  );
  
  if (itemsError) {
    return { error: "order items failed" };
  }

  const { error: checkoutUpdateError } = await supabase
    .from("checkout_sessions")
    .update({ status: "completed", order_id: order.id })
    .eq("id", checkout.id);

  if (checkoutUpdateError) {
    return { error: "checkout update failed" };
  }

  return { orderId: order.id };
}