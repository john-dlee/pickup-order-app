"use client"

import { Label } from "@/components/ui/label";
import { useCallback, useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase/client";

const supabase = createSupabaseClient();

type Order = {
  id: string;
  daily_order_number: number | null;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  order_items: OrderItem[];
};

type OrderItem = {
  item_name: string;
  quantity: number;
  is_accessory: boolean;
}

export default function AdminOrdersPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundReady, setSoundReady] = useState(false);

  const seenIds = useRef(new Set<string>());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // Initial Auth check: checks local storage instantly on page mount to see if sesison exists
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
    });

    // Real-Time Auth watcher: Listens for any auth events (Sign In, Sign Out, Token Expiry)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    })

    // Effect cleanup: Kills background listener process to prevent memory leaks when page unmounts
    return () => sub.subscription.unsubscribe();
  }, []);
  

  const loadOrders = useCallback(async () => {
    const { data, error: loadError } = await supabase  
      .from("orders")
      .select(`
        id,
        daily_order_number,
        customer_name, 
        customer_phone, 
        created_at,
        order_items(
          item_name,
          quantity,
          is_accessory
        )
      `)
      .eq("payment_status", "paid")
      .eq("status", "active")
      .order("created_at", { ascending: true});

    if (loadError) {
      console.error(loadError.message, loadError);
      return;
    }

    const next = data ?? [];

    if (isFirstLoad.current) {
      next.forEach((order) => seenIds.current.add(order.id));
      isFirstLoad.current = false;
    }

    setOrders(next);
  }, [])

  useEffect(() => {
    if (!authed) return;

    loadOrders();

    const channel = supabase
    .channel("kitchen")
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      (payload) => {
        const row = payload.new as {
          id?: string;
          payment_status?: "paid";
          status?: "active"
        };
        if (row.payment_status !== "paid" || row.status !== "active" || !row.id) return;
        if (seenIds.current.has(row.id)) return;

        seenIds.current.add(row.id);
        if (soundReady) notificationSound();
        loadOrders();
      }
    )
    .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authed, loadOrders, soundReady]);

  function notificationSound() {
    const audio = new Audio("/sounds/notification.mp3");
    audio.play().catch(() => {});
  }

  function enableSound() {
    const audio = new Audio("/sounds/notification.mp3");
    audio.play().then(() => {
      setSoundReady(true);
    }).catch(() => {
      // still enable — next order might work after gesture
      setSoundReady(true);
    });
  }

  async function  handleLogin(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("clicked login", email);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Invalid email or password");
      return;
    }

    enableSound();
    setPassword("");
    isFirstLoad.current = true;
    seenIds.current.clear();
  }

  async function markReady(orderId: string) {
    const { error: markReadyError } = await supabase
      .from("orders")
      .update({ status: "ready" })
      .eq("id", orderId);

    if (markReadyError) {
      console.error(markReadyError.message, markReadyError);
      return;
    }

    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-md p-4">
        <h1 className="text-xl font-bold">Kitchen login</h1>
        <form onSubmit={handleLogin}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Enter kitchen</Button>
        </form>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-bold">Kitchen</h1>
      {orders.length === 0 && (
        <p className="text-2xl font-bold">No active orders</p>
      )}
      {!soundReady && (
        <Button onClick={enableSound}>Sound on</Button>
      )}
      {orders.map((order) => {
        const menuItems = order.order_items.filter((item) => !item.is_accessory);
        const extras = order.order_items.filter((item) => item.is_accessory);
        return (
        <div key={order.id} className="mt-4 rounded border p-4">
          <p className="text-2xl font-bold">#{order.daily_order_number ?? "-"}</p>
          <p className="text-sm">{order.customer_name} {order.customer_phone}</p>
          <p className="text-sm">
            Ordered{" "}
            {new Date(order.created_at).toLocaleTimeString("en-AU", {
              hour: "numeric",
              minute: "2-digit",
              timeZone: "Australia/Sydney",
            })}
          </p>
          {menuItems.length > 0 && (
            <ul className="mt-2 text-sm">
              {menuItems.map((item, i) => (
                <li key={i}>
                  {item.quantity}× {item.item_name}
                </li>
              ))}
            </ul>
          )}
          
          {extras.length > 0 && (
            <>
              <p className="mt-2 text-xs font-medium text-gray-500">Extras</p>
              <ul className="text-sm">
                {extras.map((item, i) => (
                  <li key={i}>
                    {item.quantity}× {item.item_name}
                  </li>
                ))}
              </ul>
            </>
          )}
          <Button className="mt-2" onClick={() => markReady(order.id)}>Ready</Button>
        </div>
        );
      })}
    </main>
  );
}