"use client"

import type { MenuCategory } from "@/lib/menu_types";
import MenuItemRow from "@/components/menu-item-row";
import { MenuHero } from "@/components/menu/menu-hero";
import { CategoryChips } from "./category-chips";
import { useState, useCallback, useRef } from "react";
import { scrollToSection } from "@/lib/scroll-to-section";
import { useActiveCategory } from "@/app/hooks/use-active-category";

type Props = {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: Props) {
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const [pinnedSlug, setPinnedSlug] = useState<string | null>(null);
  const [scrollSpyEnabled, setScrollSpyEnabled] = useState(true);
  const spySlug = useActiveCategory(
    categories.map((c) => c.slug),
    { enabled: scrollSpyEnabled }
  );

  const handleCategorySelect = useCallback((slug: string) => {
    // Tear down listeners from a previous chip tap
    scrollCleanupRef.current?.();
  
    setPinnedSlug(slug);
    setScrollSpyEnabled(false);
    scrollToSection(slug);
  
    const resume = () => {
      setScrollSpyEnabled(true);
      setPinnedSlug(null);
      scrollCleanupRef.current = null;
    };
  
    const cleanupListeners = () => {
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
      clearTimeout(safetyTimer);
    };
  
    const onUserScroll = () => {
      cleanupListeners();
      resume();
    };
  
    // Fallback if they never scroll after tapping
    const safetyTimer = window.setTimeout(() => {
      cleanupListeners();
      resume();
    }, 5000);
  
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true });
  
    scrollCleanupRef.current = () => {
      cleanupListeners();
      resume();
    };
  }, []);

  const activeSlug = pinnedSlug ?? spySlug;
  return (
    <div className="min-h-screen pb-12">
      <MenuHero />
      <CategoryChips 
        categories={categories}
        activeSlug={activeSlug}
        onCategorySelect={handleCategorySelect} 
      />
      <main className="px-4 pb-4 pt-2">
        {categories.map((cat) => (
          <section 
            key={cat.id} 
            id={`section-${cat.slug}`}
            className="border-t-2 pt-3 first:border-t-0 first:pt-0 -mx-4 px-4"
          >
            <h2 className="text-xl font-bold">{cat.name}</h2>
            <ul className="divide-y">
              {cat.items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price_cents={item.price_cents}
                  is_available={item.is_available}
                />
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}