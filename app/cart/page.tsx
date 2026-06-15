"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatDisplayPrice } from "@/lib/utils";
import BackArrow from "@/components/BackArrow";
import ExtrasSection from "@/components/ExtrasSection";
import PickupHeader from "@/components/PickupHeader";

export default function CartPage() {
  const { 
    items, 
    totalCents, 
    updateItemQuantity,
    accessoriesTotalCents,
    orderTotalCents,
  } = useCart();

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Header - always the same */}
      <PickupHeader backHref="/menu" />

      <main className="max-w-md mx-auto pb-52">
        {items.length === 0 ? (
          <>
            <p>Your cart is empty.</p>
            <Link href="/menu">Return to menu</Link>
          </>
        ) : (
          <>
            <header className="flex items-center px-4 py-4 border-b border-gray-200 font-bold">Order details
            </header>
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
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t border-gray-200 bg-white pb-6">
          <div className="px-4 py-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatDisplayPrice(totalCents)}</span>
            </div>
            {accessoriesTotalCents > 0 && (
              <div className="flex justify-between pb-3">
                <span>Extras</span>
                <span>{formatDisplayPrice(accessoriesTotalCents)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatDisplayPrice(orderTotalCents)}</span>
            </div>
          </div>
          <div className="px-4">
            <Link 
              href="/checkout"
              className="w-full p-4 bg-[#A61C2E] text-white rounded-lg flex justify-between items-center font-semibold shadow-lg transition-transform active:scale-95"
            >
              Continue to checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}