"use client";

import { ClearCartOnMount } from "@/components/clear-cart-on-mount";
import { useEffect, useState } from "react";

type Order = {
  daily_order_number: number;
  pickup_at: string;
  customer_name: string;
  status: string;
};

export function OrderSuccessContent({ sessionId }: { sessionId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let id: ReturnType<typeof setInterval>;
    const maxAttempts = 20;

    async function load() {
      attempts++;

      if (attempts > maxAttempts) {
        if (!cancelled) setTimedOut(true);
        return;
      }

      const res = await fetch(
        `/api/orders/lookup?session_id=${encodeURIComponent(sessionId)}`
      );

      if (!res.ok) return;

      const json = (await res.json()) as { order: Order | null };

      if (!cancelled && json.order) {
        clearInterval(id);
        setOrder(json.order);
      }
    }

    load();
    id = setInterval(load, 3000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sessionId]);

  if (!order) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <ClearCartOnMount />
        <h1 className="text-xl font-bold">Payment received</h1>
        <p className="mt-2 text-sm text-gray-600">
          {timedOut
            ? "Still confirming… try refreshing the page."
            : "Confirming your order…"}
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
      {order.status === "ready" ? (
        <p className="mt-2 font-medium text-green-700">Ready for pickup!</p>
      ) : (
        <p className="mt-2 text-sm text-gray-600">
          Est. ready around {readyTime}
        </p>
      )}
    </main>
  );
}
