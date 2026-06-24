"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatDisplayPrice } from "@/lib/utils";

export default function CheckoutBar() {
  const { totalCents, items } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return null;

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-auto">
        <Link
          href="/cart"
          className="w-full h-12 px-4 bg-[#A61C2E] text-white rounded-lg flex justify-between items-center font-semibold shadow-lg transition-transform active:scale-95"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#A61C2E] text-sm font-bold">
              {totalItemsCount}
            </span>
            <span>View cart</span>
          </div>
          <span>{formatDisplayPrice(totalCents)}</span>
        </Link>
      </div>
    </div>,
    document.body
  );
}
