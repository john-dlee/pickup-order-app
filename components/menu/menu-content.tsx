"use client"

import type { MenuCategory } from "@/lib/menu_types";
import MenuItemRow from "@/components/menu-item-row";
import { MenuHero } from "@/components/menu/menu-hero";
import { CategoryChips } from "./category-chips";
import { useState, useCallback } from "react";
import { scrollToSection } from "@/lib/scroll-to-section";
import { useActiveCategory } from "@/app/hooks/use-active-category";

type Props = {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: Props) {
  const [pinnedSlug, setPinnedSlug] = useState<string | null>(null);
  const [scrollSpyEnabled, setScrollSpyEnabled] = useState(true);
  const spySlug = useActiveCategory(
    categories.map((c) => c.slug),
    { enabled: scrollSpyEnabled }
  );

  const handleCategorySelect = useCallback((slug: string) => {
    setPinnedSlug(slug);
    setScrollSpyEnabled(false);
    scrollToSection(slug);
  
    let resumed = false;
    const resume = () => {
      if (resumed) return;
      resumed = true;
      clearTimeout(timer);
      window.removeEventListener("scrollend", resume);
      setScrollSpyEnabled(true);
      setPinnedSlug(null);
    };
    const timer = window.setTimeout(resume, 1200);
    window.addEventListener("scrollend", resume);
  }, []);

  const activeSlug = pinnedSlug ?? spySlug;
  return (
    <div className="min-h-screen pb-28">
      <MenuHero />
      <CategoryChips 
        categories={categories}
        activeSlug={activeSlug}
        onCategorySelect={handleCategorySelect} 
      />
      <main className="p-4">
        {categories.map((cat) => (
          <section 
            key={cat.id} 
            id={`section-${cat.slug}`}
          >
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