"use client";

import type { MenuCategory } from "@/lib/menu_types";

type Props = {
  categories: MenuCategory[];
}

export function CategoryChips({ categories } : Props) {
  function scrollToCategory(id: string) {
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="sticky top-0 z-10 h-14 shadow-sm bg-white">
      <div className="flex items-center h-full gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => scrollToCategory(cat.id)}
            className="shrink-0 rounded-md border border-gray-200 px-3 py-2 text-md font-medium"
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}