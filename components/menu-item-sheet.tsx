"use client";

import { MenuItem } from "@/lib/menu_types"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet"
import { useCart } from "./cart-provider";
import { MAX_DISTINCT_MENU_ITEMS } from "@/lib/cart-limits";
import { Minus, Plus } from "lucide-react"; 
import { formatDisplayPrice } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { ModifierSelections } from "@/lib/menu_types";
import { EMPTY_SELECTIONS } from "@/lib/cart-lines";

type Props = {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MenuItemSheet({ item, open, onOpenChange }: Props) {
  const { items, getItemQuantity, addItem, updateItemQuantity } = useCart();
  const [selections, setSelections] = useState<ModifierSelections>(EMPTY_SELECTIONS);
  const [selectionLabels, setSelectionLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !item) return;
    setSelections(EMPTY_SELECTIONS);
    setSelectionLabels({});
  }, [open, item?.id]);

  if (!item) return null;

  const soldOut = !item.is_available;
  const hasModifiers = (item?.modifierGroups.length ?? 0) > 0;
  const lineSelections = hasModifiers ? selections : EMPTY_SELECTIONS;
  const qty = getItemQuantity(item.id, lineSelections);


  const atItemLimit = items.length >= MAX_DISTINCT_MENU_ITEMS;
  const hasCartItems = items.length > 0;
  const formattedPrice = formatDisplayPrice(item.price_cents);
  const descriptionLines = item.description
  ?.split("\n")
  .map((line) => line.trim())
  .filter(Boolean) ?? [];

  const allRequiredSelected = !hasModifiers || item.modifierGroups.every((g) => !g.required || selections[g.id]);

  const canAdd =
    !soldOut &&
    (qty > 0 || !atItemLimit) &&
    allRequiredSelected;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={`
          mx-auto max-w-md flex flex-col rounded-t-xl
          pb-16
        `}
      >
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">{item.name}</SheetTitle>
          <p className="text-base font-semibold">{formattedPrice}</p>
          {descriptionLines.length > 0 ? (
            <>
              <h2 className="pt-2 text-base font-medium">Includes:</h2>
              <SheetDescription asChild>
                <ul className="list-disc space-y-1 pr-4 pl-5 text-base leading-relaxed text-gray-700">
                  {descriptionLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </SheetDescription>
            </>
          ) : null}
          {hasModifiers &&
            item.modifierGroups.map((group) => (
              <div key={group.id} className="pt-3">
                <p className="text-sm font-medium">{group.name}</p>
                <div className="mt-2 flex gap-2">
                  {group.options.map((option) => {
                    const selected = selections[group.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelections((prev) => ({ ...prev, [group.id]: option.id }));
                          setSelectionLabels((prev) => ({ ...prev, [group.name]: option.name }));
                        }}
                        className={
                          selected
                            ? "rounded-md border border-black px-3 py-2 text-sm font-semibold"
                            : "rounded-md border border-gray-300 px-3 py-2 text-sm"
                        }
                      >
                        {option.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          <div className="mt-auto flex justify-end">
            <div className="inline-flex items-center justify-end rounded-md border mt-2">
              <button
                type="button"
                onClick={() => updateItemQuantity(item.id, qty - 1, lineSelections)}
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
                onClick={() => addItem({ 
                  id: item.id, 
                  name: item.name, 
                  price_cents: item.price_cents,
                  selections: lineSelections,
                  selectionLabels: hasModifiers ? selectionLabels : undefined,
                })}
                disabled={!canAdd}
                className="flex h-10 w-10 items-center justify-center active:bg-gray-100"
              >
                <Plus className="h-4 w-4"/>
              </button>
            </div>
          </div>
          {atItemLimit && qty === 0 && (
            <p className="mt-2 text-sm text-amber-700">
              Max {MAX_DISTINCT_MENU_ITEMS} different items per order.
            </p>
          )}
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}