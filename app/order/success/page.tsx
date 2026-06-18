import { ClearCartOnMount } from "@/components/clear-cart-on-mount";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ session_id?: string}>;
};

export default async function OrderSuccessPage({ searchParams}: Props) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <h1 className="text-xl font-bold">Payment received</h1>
        <p className="mt-2 text-sm text-gray-600">Missing order reference.</p>
      </main>
    );
  }

  const supabase = createSupabaseServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select("daily_order_number, pickup_at, customer_name")
    .eq("stripe_checkout_session_id", session_id)
    .maybeSingle();
  

  // customer can land on success before webhook finishes so display loading
  if (!order) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <h1 className="text-xl font-bold">Payment received</h1>
        <p className="mt-2 text-sm text-gray-600">
          Confirming your order… refresh in a few seconds.
        </p>
      </main>
    );
  }

  const readyTime = new Date(order.pickup_at).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Sydney",
  });
    
  return (
    
    <main className="mx-auto max-w-md p-6 text-center">
      <ClearCartOnMount />
      <h1 className="text-xl font-bold">Payment received</h1>
      <p className="mt-4 text-3xl font-bold">Order #{order.daily_order_number}</p>
      <p className="mt-2 text-sm text-gray-600">
        Thanks {order.customer_name} — we&apos;re preparing your order.
      </p>
      {readyTime && (
         <p className="mt-2 text-sm text-gray-600">Est. ready around {readyTime}</p>
      )}
    </main>
  );
}