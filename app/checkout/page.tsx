"use client";

import { useCart } from "@/components/cart-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input"; 
import PickupHeader from "@/components/PickupHeader";
import { Label } from "@/components/ui/label";
import { formatDisplayPrice, gstFromInclusiveCents } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { normaliseAuMobile } from "@/lib/phone";
import { createSupabaseClient } from "@/lib/supabase/client";
import { isStoreOpenNow } from "@/lib/store-hours";
import { Footer } from "@/components/footer";

const supabase = createSupabaseClient();

export default function CheckoutPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [storeOpen, setStoreOpen] = useState(true);
  const [storeNotice, setStoreNotice] = useState("");

  const trimmedName = name.trim();
  const normalisedPhone = normaliseAuMobile(phone);
  const trimmedEmail = email.trim();

  const canPay = 
    trimmedName.length > 0 && 
    normalisedPhone &&
    trimmedEmail.length > 0;

  const { items, hasLoaded, orderTotalCents, accessoryQuantity } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function loadStoreHours() {
      const [settingsRes, hoursRes] = await Promise.all([
        supabase.from("store_settings").select("is_open").single(),
        supabase
          .from("store_hours")
          .select("day_of_week, open_time, close_time, is_closed")
          .order("day_of_week"),
      ]);
    
      if (settingsRes.error || hoursRes.error || !settingsRes.data) {
        console.error(settingsRes.error ?? hoursRes.error);
        setStoreOpen(false);
        setStoreNotice("Unable to check store hours. Please try again later.");
        return;
      }

      if (!hoursRes.data?.length) {
        console.error("store_hours is empty — seed the table in Supabase");
        setStoreOpen(false);
        setStoreNotice("Unable to check store hours. Please try again later.");
        return;
      }

      const isOpen = isStoreOpenNow(settingsRes.data, hoursRes.data);
      setStoreOpen(isOpen);
      if (!isOpen) {
        setStoreNotice("Online ordering is currently closed.");
      }
    }
  
    loadStoreHours();
  }, []);

  useEffect(() => {
    if(!hasLoaded) return;
    if (items.length === 0) {
      router.replace("/menu");
    }
  }, [items.length, router, hasLoaded])

  if (!hasLoaded || items.length === 0) return null;

  async function handlePay() {
    if (!canPay || isPaying || !storeOpen) return;

    setCheckoutError("");
    setIsPaying(true);

    try {
      // POST /api/checkout and redirect to stripe
      const accessories = Object.entries(accessoryQuantity)
        .filter(([, quantity]) => quantity > 0)
        .map(([id, quantity]) => ({ id, quantity }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
          name: trimmedName,
          phone: normalisedPhone,
          email: trimmedEmail,
          items: items.map(({id, quantity, selections, selectionLabels }) => ({
            id, 
            quantity,
            selections,
            selectionLabels,
          })),
          accessories,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error ?? "Checkout failed");
        setCheckoutError(data.error ?? "Checkout failed. Please try again later.");
        return;
      }

      window.location.href = data.url;

    } catch (err) {
      console.log(err);
      setCheckoutError("Something went wrong. Please try again later.");
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white text-black font-sans shadow-lg">
      <PickupHeader backHref="/cart" />
      <main>
        <div className="bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900 border-b border-gray-200">
          We start preparing as soon as you pay. Estimated ready in <span className="font-bold">5-15 minutes.</span>
        </div>
        <header className="flex justify-center text-xl font-bold px-4 pt-4 pb-1">
          <h2>Your details</h2>
        </header>
        <div className="flex flex-col gap-4 px-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="give-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0412 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email"
              placeholder="example@example.com"
              autoComplete="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      </main>
      
      <div className="fixed inset-x-0 bottom-[9rem] z-40 mx-auto max-w-md bg-white">
        <Footer />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t border-gray-200 bg-white px-4 pb-4 shadow-lg">
        <div className="flex justify-between mb-1 pt-4 font-bold text-lg">
          <span>Total</span>
          <span>{formatDisplayPrice(orderTotalCents)}</span>
        </div>
        <div className="flex justify-between mb-4 text-sm text-gray-600">
          <span>Includes GST (10%)</span>
          <span>{formatDisplayPrice(gstFromInclusiveCents(orderTotalCents))}</span>
        </div>
        {checkoutError && (
          <p className="mb-3 text-sm text-red-600">{checkoutError}</p>
        )}
        {storeNotice && (
          <p className="mb-3 text-sm text-amber-600">{storeNotice}</p>
        )}
        <Button
          type="button"
          disabled={!canPay || !storeOpen || isPaying}
          onClick={handlePay}
          className="
            w-full h-12 bg-[#A61C2E] rounded-lg font-semibold text-base disabled:opacity-50
            transition-transform duration-150 active:scale-95 shadow-lg px-4 border-0"
        >
          {isPaying ? "Redirecting..." : "Place order"}
        </Button>
      </div>
    </div>
  );
}