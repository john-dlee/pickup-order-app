"use client";

import { useCart } from "@/components/cart-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input"; 
import PickupHeader from "@/components/PickupHeader";
import { Label } from "@/components/ui/label";
import { formatDisplayPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { normaliseAuMobile } from "@/lib/phone";

export default function CheckoutPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const canPay = name.trim().length > 0 && normaliseAuMobile(phone);
  const isStoreOpen = true; // implement lib/store-hours.ts later

  const { items, hasLoaded, orderTotalCents, accessoryQuantity } = useCart();
  const router = useRouter();

  useEffect(() => {
    if(!hasLoaded) return;
    if (items.length === 0) {
      router.replace("/menu");
    }
  }, [items.length, router, hasLoaded])

  if (!hasLoaded || items.length === 0) return null;

  async function handlePay() {
    if (!canPay || isPaying || !isStoreOpen) return;

    setIsPaying(true);
    try {
      // POST /api/checkout and redirect to stripe
      const accessories = Object.entries(accessoryQuantity)
        .filter(([, quantity]) => quantity > 0)
        .map(([id, quantity]) => ({ id, quantity }));
      
      const trimmedName = name.trim();
      const normalisedPhone = normaliseAuMobile(phone);

      if (!normalisedPhone) {
        // setPhoneError
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
          name: trimmedName,
          phone: normalisedPhone,
          items: items.map(({id, quantity}) => ({ id, quantity })),
          accessories,
        }),
      });
      console.log("Pay clicked - imp API");

      const data = await res.json();

      if (!res.ok) {
        console.error(data.error ?? "Checkout failed");
        return;
      }

      window.location.href = data.url;

    } catch (err) {
      console.log(err);
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <PickupHeader backHref="/cart" />
      <main className="max-w-md mx-auto pb-52">
        <div className="bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900 border-b border-gray-200">
          We start preparing as soon as you pay. Estimated ready in <span className="font-bold">5-10 minutes.</span>
        </div>
        <section className="flex justify-center text-xl font-bold px-4 pt-4 pb-1">
          <h2>Your details</h2>
        </section>
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
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t border-gray-200 bg-white px-4 pb-6">
        <div className="flex justify-between mb-4 pt-4 font-bold text-lg">
          <span>Total</span>
          <span>{formatDisplayPrice(orderTotalCents)}</span>
        </div>
        <Button
          type="button"
          disabled={!canPay || !isStoreOpen || isPaying}
          onClick={handlePay}
          className="h-11 w-full bg-[#A61C2E] hover:bg-[#8f1826] disabled:opacity-50"
        >
          {isPaying ? "Redirecting..." : "Place order"}
        </Button>
      </div>
    </div>
  );
}