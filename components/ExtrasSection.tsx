"use client";

import { Minus, Plus } from "lucide-react";
import { ACCESSORIES } from "@/lib/accessories";
import { formatDisplayPrice } from "@/lib/utils";
import { useCart } from "@/components/cart-provider";

export default function ExtrasSection() {
  const { getAccessoryQuantity, updateAccessoryQuantity } = useCart();

  return (
    <div>
      <header className="px-4 pt-4 pb-1 font-bold">Extras</header>
      <div className="px-4 divide-y divide-gray-200">
        {ACCESSORIES.map((accessory) => {
          const quantity = getAccessoryQuantity(accessory.id);

          return(
            <div key={accessory.id} className="flex w-full items-center justify-between py-3">
              <span>
                {accessory.name}
                {accessory.price_cents > 0 && (
                  <span className="text-gray-500 text-sm">
                    {" "}+ {formatDisplayPrice(accessory.price_cents)}
                  </span>
                )}
              </span>

              <div className="inline-flex shrink-0 items-center rounded border gap-1">       
                <button 
                  type="button"
                  disabled={quantity === 0}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40"
                  onClick={() => updateAccessoryQuantity(accessory.id, quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[1.25rem] text-center font-semibold text-sm tabular-nums">
                  {quantity}
                </span>
                <button 
                  type="button"
                  disabled={quantity >= accessory.maxQuantity}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40"
                  onClick={() => updateAccessoryQuantity(accessory.id, quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}