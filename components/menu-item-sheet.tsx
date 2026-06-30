"use client";

import { MenuItem } from "@/lib/menu_types"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet"
import { useCart } from "./cart-provider";
import { MAX_DISTINCT_MENU_ITEMS } from "@/lib/cart-limits";
import { Minus, Plus } from "lucide-react"; 
import { formatDisplayPrice } from "@/lib/utils";

type Props = {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MenuItemSheet({ item, open, onOpenChange }: Props) {
  const { items, getItemQuantity, addItem, updateItemQuantity } = useCart();

  if (!item) return null;

  const qty = getItemQuantity(item.id);
  const soldOut = !item.is_available;
  const atItemLimit = items.length >= MAX_DISTINCT_MENU_ITEMS;
  const canAdd = !soldOut && (qty > 0 || !atItemLimit);
  const hasCartItems = items.length > 0;

  const formattedPrice = formatDisplayPrice(item.price_cents);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={`
          mx-auto max-w-md flex flex-col rounded-t-xl
          pb-[max(2rem,env(safe-area-inset-bottom))]
          ${hasCartItems ? "pb-20" : ""}
        `}
      >
        <SheetHeader>
          <SheetTitle>{item.name}</SheetTitle>
          <p className="text-base font-semibold">{formattedPrice}</p>
        </SheetHeader>

        {item.description ? (
          <SheetDescription className="text-base px-4 leading-relaxed text-gray-700">
            {item.description}
          </SheetDescription>
        ) : null }
        <div className="mt-auto flex justify-end px-4">
          <div className="inline-flex items-center justify-end rounded border">
            <button
              type="button"
              onClick={() => updateItemQuantity(item.id, qty - 1)}
              disabled={qty === 0}
              className="flex h-10 w-10 items-center justify-center active:bg-gray-100"
            >
              <Minus className="h-4 w-4"/>
            </button>
            <span className="min-w-[2rem] text-center text-lg font-semibold tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => addItem({ id: item.id, name: item.name, price_cents: item.price_cents })}
              disabled={!canAdd}
              className="flex h-10 w-10 items-center justify-center active:bg-gray-100"
            >
              <Plus className="h-4 w-4"/>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}