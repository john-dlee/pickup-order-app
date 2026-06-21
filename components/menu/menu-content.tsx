"use client"

import type { MenuCategory } from "@/lib/menu_types";
import MenuItemRow from "@/components/menu-item-row";
import { MenuHero } from "@/components/menu/menu-hero";
import { CategoryChips } from "./category-chips";

type Props = {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: Props) {
  return (
    <div className="min-h-screen pb-28">
      <MenuHero />
      <CategoryChips categories={categories} />
      <main className="p-4">
        {categories.map((cat) => (
          <section 
            key={cat.id} 
            id={`cat-${cat.id}`}
            className="scroll-mt-14">
            <h2 className="text-xl font-bold">{cat.name}</h2>
            {cat.items.map((item) => (
              <MenuItemRow
                key={item.id}
                id={item.id}
                name={item.name}
                price_cents={item.price_cents}
              />
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}