"use client"

import Link from "next/link";
import { useCart } from "@/components/cart-provider";

export default function CartStickyBar() {
  const { updateItemQuantity, totalCents, items } = useCart();
  
  if (items.length === 0) return null;
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const formattedPrice = (totalCents / 100).toFixed(2);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md pointer-events-none flex flex-col items-center p-4">
        <div className="w-full pointer-events-auto">
          <Link
            href="/cart"
            className="w-full p-4 bg-[#A61C2E] text-white rounded-full flex justify-between items-center font-semibold shadow-lg transition-transform active:scale-95"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#A61C2E] text-sm font-bold">
                {totalItemsCount}
              </span>
              <span>Checkout</span>
            </div>
            <span>{formattedPrice}</span>
          </Link>
        </div>
      </div>
      <div className="mt-5 font-bold">
        Subtotal: {formattedPrice}
      </div>
    </>
  );
}