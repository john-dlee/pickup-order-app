"use client"

import { useCart } from "@/components/cart-provider";
import { formatDisplayPrice } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

type MenuItemRowProps = {
  id: string;
  name: string;
  price_cents: number;
  is_available: boolean;
  onOpen: () => void;
};

export default function MenuItemRow({ id, name, price_cents, is_available, onOpen }: MenuItemRowProps) {
  const { getItemQuantity } = useCart();
  const qty = getItemQuantity(id);
  const soldOut = !is_available;

  const formattedPrice = formatDisplayPrice(price_cents);

  return (
    <li className={soldOut ? "opacity-50" : "hover:bg-gray-50 active:bg-gray-100"}>
      <button
        type="button"
        onClick={onOpen}
        disabled={soldOut}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left disabled:pointer-events-none"
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-600">{formattedPrice}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {qty > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-1.5 text-sm font-semibold tabular-nums">
              {qty}
            </span>
          )}
          {soldOut ? (
            <span className="text-sm font-medium text-gray-500">Sold out</span>
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>
    </li>
  );
}