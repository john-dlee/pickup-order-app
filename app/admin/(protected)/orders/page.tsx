"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase/client";
import { getSydneyDateString } from "@/lib/sydney-time";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNFULFILLED_ALERT_MINUTES } from "@/lib/checkout-constraints";
import { formatDisplayPrice } from "@/lib/utils";

const supabase = createSupabaseClient();

type Order = {
  id: string;
  status: string;
  daily_order_number: number | null;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  ready_at: string | null;
  order_items: OrderItem[];
};

type OrderItem = {
  item_name: string;
  quantity: number;
  is_accessory: boolean;
  item_notes: string | null;
};

type UnfulfilledCheckout = {
  id: string;
  customer_name: string;
  customer_phone: string;
  paid_at: string;
  total_cents: number;
};

function OrderItemsList({ items }: { items: OrderItem[] }) {
  const menuItems = items.filter((item) => !item.is_accessory);
  const extras = items.filter((item) => item.is_accessory);

  return (
    <>
      {menuItems.length > 0 && (
        <ul className="text-md font-medium space-y-1.5">
          {menuItems.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-bold bg-gray-100">
                {item.quantity}
              </span>
              <span>
                {item.item_name}
                {item.item_notes && (
                  <span className="text-gray-600"> — {item.item_notes}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {extras.length > 0 && (
        <div className={menuItems.length > 0 ? "mt-2 border-t pt-2" : ""}>
          <ul className="text-md font-medium space-y-1.5">
            {extras.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-bold bg-gray-100">
                  {item.quantity}
                </span>
                <span>{item.item_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default function AdminOrdersPage() {
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [soundReady, setSoundReady] = useState(false);
  const [expandedCompletedId, setExpandedCompletedId] = useState<string | null>(
    null
  );
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "live" | "offline"
  >("connecting");
  const [unfulfilled, setUnfulfilled] = useState<UnfulfilledCheckout[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const seenUnfulfilledIds = useRef(new Set<string>());
  const isFirstUnfulfilledLoad = useRef(true);
  const seenIds = useRef(new Set<string>());
  const isFirstLoad = useRef(true);
  const soundReadyRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function notificationSound() {
    if (!audioRef.current || !soundReadyRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }

  const loadUnfulfilled = useCallback(async () => {
    const cutoff = new Date(
      Date.now() - UNFULFILLED_ALERT_MINUTES * 60 * 1000
    ).toISOString();
  
    const { data, error } = await supabase
      .from("checkout_sessions")
      .select("id, customer_name, customer_phone, paid_at, total_cents")
      .eq("status", "pending")
      .not("paid_at", "is", null)
      .lt("paid_at", cutoff)
      .order("paid_at", { ascending: true });
  
    if (error) {
      console.error("loadUnfulfilled failed", error);
      return;
    }
  
    const next = data ?? [];
  
    if (isFirstUnfulfilledLoad.current) {
      next.forEach((row) => seenUnfulfilledIds.current.add(row.id));
      isFirstUnfulfilledLoad.current = false;
    } else {
      for (const row of next) {
        if (seenUnfulfilledIds.current.has(row.id)) continue;
        seenUnfulfilledIds.current.add(row.id);
        if (soundReadyRef.current) notificationSound();
      }
    }
  
    setUnfulfilled(next);
  }, []);

  const loadOrders = useCallback(async () => {
    const today = getSydneyDateString();
    const { data, error: loadError } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        daily_order_number,
        customer_name, 
        customer_phone, 
        created_at,
        ready_at,
        order_items(
          item_name,
          quantity,
          is_accessory,
          item_notes
        )
      `)
      .eq("payment_status", "paid")
      .eq("order_date", today)
      .in("status", ["active", "ready"])
      .order("created_at", { ascending: true });

    if (loadError) {
      console.error(loadError.message, loadError);
      return;
    }

    const next = data ?? [];

    if (isFirstLoad.current) {
      next.forEach((order) => seenIds.current.add(order.id));
      isFirstLoad.current = false;
    } else {
      for (const order of next) {
        if (seenIds.current.has(order.id)) continue;
        seenIds.current.add(order.id);
        if (order.status === "active" && soundReadyRef.current) {
          notificationSound();
        }
      }
    }

    setTodayOrders(next);
  }, []);

  async function dismissCheckout(checkoutId: string) {
    if (!window.confirm("Mark as handled without sending to kitchen?")) return;
  
    const { error } = await supabase
      .from("checkout_sessions")
      .update(
        {
          status: "expired",
          review_reason: "dismissed by kitchen",
        }
      )
      .eq("id", checkoutId);

    if (error) {
      console.error("Dismiss failed", error);
      return;
    }
    await loadUnfulfilled();
  }

  async function sendToKitchen(checkoutId: string) {
    setSendingId(checkoutId);
  
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error("Not logged in");
        return;
      }
  
      const res = await fetch("/api/admin/fulfill-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ checkout_id: checkoutId }),
      });
  
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        console.error("Send to kitchen failed", json);
        return;
      }
  
      await loadOrders();
      await loadUnfulfilled();
    } finally {
      setSendingId(null);
    }
  }

  useEffect(() => {
    loadUnfulfilled();
    const id = setInterval(loadUnfulfilled, 60_000);
    return () => clearInterval(id);
  }, [loadUnfulfilled]);

  useEffect(() => {
    const channel = supabase
      .channel("kitchen")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        () => {
          loadOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => {
          loadOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_items"},
        () => {
          loadOrders();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("live");
          loadOrders();
        } else if (
          status === "TIMED_OUT" || 
          status === "CLOSED" ||
          status === "CHANNEL_ERROR"
        ) {
          setConnectionStatus("offline");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  useEffect(() => {
    const id = setInterval(loadOrders, 120_000);
    return () => clearInterval(id);
  }, [loadOrders]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadOrders();
        loadUnfulfilled();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loadOrders]);

  function enableSound() {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/notification.mp3");
    }
    audioRef.current
      .play()
      .then(() => {
        soundReadyRef.current = true;
        setSoundReady(true);
      })
      .catch(() => {
        soundReadyRef.current = true;
        setSoundReady(true);
      });
  }

  function formatPhone(phone: string) {
    const local = phone.replace(/^\+61/, "0");
    if (local.length === 10) {
      return local.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
    }
    return local;
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-AU", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Australia/Sydney",
    });
  }

  async function markReady(orderId: string) {
    const readyAt = new Date().toISOString();
    const { error: markReadyError } = await supabase
      .from("orders")
      .update({ status: "ready", ready_at: readyAt })
      .eq("id", orderId);

    if (markReadyError) {
      console.error(markReadyError.message, markReadyError);
      return;
    }

    setTodayOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: "ready", ready_at: readyAt }
          : order
      )
    );
  }

  const queueOrders = todayOrders.filter((order) => order.status === "active");
  const inQueue = queueOrders.length;
  const doneToday = todayOrders.filter((order) => order.status === "ready").length;
  const completedOrders = todayOrders
    .filter((order) => order.status === "ready")
    .sort((a, b) => (b.ready_at ?? b.created_at).localeCompare(a.ready_at ?? a.created_at));

  return (
    <main className="w-full border rounded-xl">
      {unfulfilled.length > 0 && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            Paid but not in kitchen ({unfulfilled.length})
          </p>
          <ul className="mt-2 space-y-2">
            {unfulfilled.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 text-sm border border-amber-300 rounded-md p-2"
              >
                <div>
                  <span className="font-medium">{row.customer_name}</span>
                  {" · "}
                  <span>{formatPhone(row.customer_phone)}</span>
                  {" · "}
                  <span className="text-gray-600">
                    paid {formatTime(row.paid_at)}
                  </span>
                  {" · "}
                  <span className="text-gray-600">
                    {formatDisplayPrice(row.total_cents)}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    size="sm"
                    disabled={sendingId === row.id}
                    className="bg-[#A61C2E] font-semibold"
                    onClick={() => sendToKitchen(row.id)}
                  >
                    {sendingId === row.id ? "Sending…" : "Send to kitchen"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismissCheckout(row.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {connectionStatus === "offline" && (
        <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>Connection lost - orders still check every 2 minutes.</p>
          <Button variant="outline" size="sm" onClick={() => {
            loadOrders();
            loadUnfulfilled();
            setConnectionStatus("live");
          }}>
            Refresh orders
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between p-4 gap-4 border-b">
        <h1 className="text-xl font-bold">Kitchen</h1>
        <div className="flex items-center gap-3">
          {!soundReady && (
            <div className="">
              <Button 
               className="bg-[#A61C2E]"
                onClick={enableSound}
              >
                Sound on
              </Button>
            </div>
          )}
          <Link href="/admin/menu" className="text-sm text-gray-600 underline">
            Menu
          </Link>
        </div>
      </div>
      <div className="flex gap-1 border-b">
        <div className="flex flex-col border-r px-4 py-2">
          <span className="text-md font-medium text-gray-500">In queue</span>
          <span className="text-2xl font-bold tabular-nums text-[#b45309]">{inQueue}</span>
        </div>
        <div className="flex flex-col border-r px-4 py-2">
          <span className="text-md font-medium text-gray-500">Done today</span>
          <span className="text-2xl font-bold tabular-nums text-[#047857]">{doneToday}</span>
        </div>
      </div>
      {queueOrders.length === 0 && (
        <p className="mt-4 px-4 text-sm text-gray-600">No active orders</p>
      )}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {queueOrders.map((order) => (
            <div key={order.id} className="flex flex-col h-full rounded-xl border p-3">
              <div className="flex justify-between border-b">
                <div className="pb-1">
                  <p className="text-2xl font-bold">#{order.daily_order_number ?? "-"}</p>
                  <p className="flex flex-col text-sm">
                    <span>{order.customer_name}</span>
                    <span>{formatPhone(order.customer_phone)}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {formatTime(order.created_at)}
                  </p>
                </div>
              </div>
              <div className="py-2">
                <OrderItemsList items={order.order_items} />
              </div>
              <Button
                className="mt-auto w-full text-md font-semibold h-11 bg-[#A61C2E]"
                onClick={() => markReady(order.id)}
              >
                Ready
              </Button>
            </div>
          ))}
      </div>

      {completedOrders.length > 0 && (
        <section className="border-t">
          <h2 className="px-4 pt-4 text-base font-semibold text-gray-700">
            Completed ({completedOrders.length})
          </h2>
          <p className="px-4 text-sm text-gray-500">Tap an order to view items</p>
          <ul className="px-4 pb-4 divide-y">
            {completedOrders.map((order) => {
              const isExpanded = expandedCompletedId === order.id;
              return (
                <li key={order.id} className="border rounded-lg p-2">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() =>
                      setExpandedCompletedId((prev) =>
                        prev === order.id ? null : order.id
                      )
                    }
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">#{order.daily_order_number ?? "-"}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {order.customer_name} · {formatPhone(order.customer_phone)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="text-sm font-medium text-[#047857]">
                        Ready {formatTime(order.ready_at ?? order.created_at)}
                      </p>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-gray-500 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3">
                      <OrderItemsList items={order.order_items} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
