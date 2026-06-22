"use client"

import { useCart } from "@/components/cart-provider";
import { Minus, Plus } from "lucide-react";

type MenuItemRowProps = {
  id: string;
  name: string;
  price_cents: number;
};

export default function MenuItemRow({ id, name, price_cents }: MenuItemRowProps) {
  const { addItem, getItemQuantity, updateItemQuantity } = useCart();
  const qty = getItemQuantity(id);

  const formattedPrice = (price_cents / 100).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD"
  });

  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{name}</div>
        <div className="text-sm text-gray-600">{formattedPrice}</div>
      </div>

      <div className="shrink-0">
        {qty === 0 ? (
          <button
            type="button"
            onClick={() => addItem({ id, name, price_cents })}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm border px-3 active:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        ) : (
          <div className="inline-flex items-center rounded border">
            <button
              type="button"
              onClick={() => updateItemQuantity(id, qty - 1)}
              className="flex h-9 w-9 items-center justify-center active:bg-gray-100"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[1.25rem] text-center text-sm font-semibold tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => addItem({ id, name, price_cents })}
              className="flex h-9 w-9 items-center justify-center active:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}