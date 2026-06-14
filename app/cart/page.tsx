"use client";

import Link from "next/link";
import { Minus, Plus, ArrowLeft } from "lucide-react";
import { useCart } from "@/components/cart-provider";

export default function CheckoutPage() {
  const { items, totalCents, updateItemQuantity } = useCart();

  const formattedPrice = (totalCents / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Header - always the same */}
      <div className="flex items-center px-4 h-14 border-b border-gray-200">
        <Link href="/menu" className="flex flex-shrink-0 items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 text-center">Pickup</div>
        <div className="w-10" />
      </div>

      <main className="max-w-md mx-auto">
        {items.length === 0 ? (
          <>
            <p>Your cart is empty.</p>
            <Link href="/menu">Return to menu</Link>
          </>
        ) : (
          <>
            <header className="flex items-center px-4 py-4 border-b border-gray-200">Order details
            </header>
            <div className="flex flex-col gap-4 p-4">
              {items.map((item) => (
                <div key={item.id} className="flex w-full items-center justify-between"> 
                  <span>{item.name}</span>    
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
            </div>
            // accessory row
            <div>
              // quantity controls
            </div>
            // total payment div including subtotal
            <div>
            </div>
            <Link href="/checkout">Continue to checkout</Link>
          </>
        )}  
      </main>
    </div>
  );
}