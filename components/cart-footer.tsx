"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatDisplayPrice, gstFromInclusiveCents } from "@/lib/utils";

export default function CartFooter() {
  const { items, totalCents, accessoriesTotalCents, orderTotalCents } = useCart();
  const hasItems = items.length > 0;

  return (
    <div className="
      fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md 
      border-t border-gray-200 bg-white p-4 shadow-lg
      ">
      {hasItems && (
        <>
          <div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatDisplayPrice(totalCents)}</span>
            </div>
            {accessoriesTotalCents > 0 && (
              <div className="flex justify-between">
                <span>Extras</span>
                <span>{formatDisplayPrice(accessoriesTotalCents)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Includes GST (10%)</span>
              <span>{formatDisplayPrice(gstFromInclusiveCents(orderTotalCents))}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatDisplayPrice(orderTotalCents)}</span>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              href="/checkout"
              className="
                w-full h-12 px-4 bg-[#A61C2E] text-white rounded-lg 
                flex justify-center items-center font-semibold shadow-lg 
                transition-transform duration-150 active:scale-95"
            >
              Checkout
            </Link>
          </div>
        </>
      )}
      {!hasItems && (
        <div>
          <Link 
            href="/menu"
            className="
            flex h-12 w-full items-center justify-center rounded-lg
            bg-[#A61C2E] px-4 font-semibold text-white shadow-lg
            transition-transform duration-300 active:scale-95"
          >
            Return to menu
          </Link>
        </div>
      )}
    </div>
  );
}