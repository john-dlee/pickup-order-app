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

  if (!mounted) return null;

  const isVisible = items.length > 0;
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return createPortal(
    <div
      className="
        pointer-events-none fixed bottom-0 left-1/2 z-[60] w-full max-w-md
        -translate-x-1/2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]
      "
    >
      <Link
        href="/cart"
        tabIndex={isVisible ? 0 : -1}
        aria-hidden={!isVisible}
        className={`
          flex h-12 w-full items-center justify-between rounded-lg
          bg-[#A61C2E] px-4 font-semibold text-white shadow-lg
          transition-opacity active:opacity-90
          ${isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}
        `}
      >
        <div className="flex items-center gap-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#A61C2E] text-sm font-bold">
            {totalItemsCount}
          </span>
          <span>View cart</span>
        </div>
        <span className="tabular-nums">{formatDisplayPrice(totalCents)}</span>
      </Link>
    </div>,
    document.body
  );
}
