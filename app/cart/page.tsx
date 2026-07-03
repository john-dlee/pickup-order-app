"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatDisplayPrice, gstFromInclusiveCents } from "@/lib/utils";
import ExtrasSection from "@/components/ExtrasSection";
import PickupHeader from "@/components/PickupHeader";
import CartFooter from "@/components/cart-footer";
import { MAX_DISTINCT_MENU_ITEMS } from "@/lib/cart-limits";


export default function CartPage() {
  const { 
    items,
    updateItemQuantity,
  } = useCart();

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-lg text-black font-sans">
      {/* Header - always the same */}
      <PickupHeader backHref="/menu" />

      <main className="pb-52">
        {items.length === 0 ? (
          <>
            <header className="flex items-center px-4 py-4 border-b border-gray-200 text-xl font-bold">Order details
            </header>
            <p className="text-center mt-3">Your cart is empty.</p>
          </>
        ) : (
          <>
            <header className="flex items-center px-4 py-4 border-b border-gray-200 text-xl font-bold">Order details
            </header>
            {items.length >= MAX_DISTINCT_MENU_ITEMS && (
              <p className="mx-4 mt-4 text-sm text-amber-700">
                You&apos;ve reached the max of {MAX_DISTINCT_MENU_ITEMS} different items.
              </p>
            )}
            <div className="flex flex-col gap-4 p-4 border-b border-gray-200">
              {items.map((item) => (
                <div key={item.id} className="flex w-full items-center justify-between"> 
                  <div className="flex flex-col">
                    <div className="font-bold">{item.name}</div>    
                    <div>{formatDisplayPrice(item.price_cents)}</div>
                  </div>
                  <div className="inline-flex shrink-0 items-center rounded border gap-1">       
                    <button 
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100"
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[1.25rem] text-center font-semibold text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <button 
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100"
                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <Link 
                href={"/menu"}
                className="inline-flex items-center justify-center px-4 h-9 bg-neutral-100 text-black font-semibold gap-1"
              >
                <Plus className="h-4 w-4"/>Add items
              </Link>
            </div>
            <ExtrasSection />
          </>
        )}  
      </main>
      <CartFooter />
    </div>
  );
}
