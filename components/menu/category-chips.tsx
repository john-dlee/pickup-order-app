"use client";

import type { MenuCategory } from "@/lib/menu_types";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  categories: MenuCategory[];
  activeSlug?: string;
  onCategorySelect: (slug: string) => void;
}

function scrollChipIntoViewIfNeeded(chip: HTMLElement, container: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  const chipRect = chip.getBoundingClientRect();
  const pad = 16;

  // Chips are visible, do nothing
  if (chipRect.left >= containerRect.left + pad && chipRect.right <= containerRect.right - pad) {
    return;
  }

  // Clipped on left, move right
  if (chipRect.left < containerRect.left + pad) {
    container.scrollTo({
      left: container.scrollLeft + (chipRect.left - containerRect.left) - pad,
      behavior: "smooth",
    })
  }

  // Clipped on right, move left
  if (chipRect.right > containerRect.right - pad) {
    container.scrollTo({
      left: container.scrollLeft + (chipRect.right - containerRect.right) + pad,
      behavior: "smooth",
    })
  }
}

export function CategoryChips({ categories, activeSlug, onCategorySelect } : Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!activeSlug) return;

    const container = scrollRef.current
    const chip = chipRefs.current.get(activeSlug);
    if (!container || !chip) return;

    scrollChipIntoViewIfNeeded(chip, container);
  }, [activeSlug]);

  return (
    <div className="sticky top-0 z-10 h-14 shadow-sm bg-white">
      <div 
        className="flex items-center h-full gap-2 px-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={scrollRef}
      >
        {categories.map((cat) => {
          const isActive = activeSlug === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategorySelect(cat.slug)}
              className={cn(
                "shrink-0 rounded-md border px-3 py-2 text-md font-medium transition-colors",
                isActive
                  ? "border-[#A61C2E]/40 bg-[#A61C2E]/10 text-[#8f1826] shadow-sm"
                  : "border-gray-200 bg-white text-gray-900 shadow-none"
              )}
              ref={(el) => {
                if (el) chipRefs.current.set(cat.slug, el);
                else chipRefs.current.delete(cat.slug);
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}