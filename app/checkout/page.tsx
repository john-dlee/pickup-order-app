"use client";

import { useCart } from "@/components/cart-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PickupHeader from "@/components/PickupHeader";

export default function CheckoutPage() {
  const { items, hasLoaded } = useCart();
  const router = useRouter();

  useEffect(() => {
    if(!hasLoaded) return;
    if (items.length === 0) {
      router.replace("/menu");
    }
  }, [items.length, router, hasLoaded])

  if (!hasLoaded || items.length === 0) return null;

  return (
    <div>
      <PickupHeader backHref="/cart" />
      <div className="w-full px-4 py-3 border-b text-sm font-medium bg-blue-50 text-blue-900 border-b border-blue-100">
        <span>We start preparing as soon as you pay. Estimated ready in 5–10 minutes.</span>
      </div>
      
    </div>
  );
}