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