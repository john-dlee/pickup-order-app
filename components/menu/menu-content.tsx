"use client"

import type { MenuCategory, MenuItem } from "@/lib/menu_types";
import MenuItemRow from "@/components/menu-item-row";
import { MenuItemSheet } from "@/components/menu-item-sheet";
import { MenuHero } from "@/components/menu/menu-hero";
import { CategoryChips } from "./category-chips";
import { useState, useCallback, useRef, useEffect } from "react";
import { scrollToSection } from "@/lib/scroll-to-section";
import { useActiveCategory } from "@/app/hooks/use-active-category";
import { createSupabaseClient } from "@/lib/supabase/client";
import { formatWeeklyHours, isStoreOpenNow } from "@/lib/store-hours";

const supabase = createSupabaseClient();

type Props = {
  categories: MenuCategory[];
}

export function MenuContent({ categories }: Props) {
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const [pinnedSlug, setPinnedSlug] = useState<string | null>(null);
  const [scrollSpyEnabled, setScrollSpyEnabled] = useState(true);
  const [showClosedBanner, setShowClosedBanner] = useState(false);
  const [hoursLines, setHoursLines] = useState<{ label: string; hours: string }[]>([]);
  const spySlug = useActiveCategory(
    categories.map((c) => c.slug),
    { enabled: scrollSpyEnabled }
  );
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    async function loadStoreHours() {
      const [settingsRes, hoursRes] = await Promise.all([
        supabase.from("store_settings").select("is_open").single(),
        supabase
          .from("store_hours")
          .select("day_of_week, open_time, close_time, is_closed")
          .order("day_of_week"),
      ]);

      if (settingsRes.error || hoursRes.error || !settingsRes.data) {
        console.error(settingsRes.error ?? hoursRes.error);
        return;
      }

      if (!hoursRes.data?.length) {
        console.error("store_hours is empty — seed the table in Supabase");
        if (!settingsRes.data.is_open) {
          setShowClosedBanner(true);
        }
        return;
      }

      if (!isStoreOpenNow(settingsRes.data, hoursRes.data)) {
        setShowClosedBanner(true);
        setHoursLines(formatWeeklyHours(hoursRes.data));
      }
    }

    loadStoreHours();
  }, []);

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

  function openItemSheet(item: MenuItem) {
    setSelectedItem(item);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      setTimeout(() => setSelectedItem(null), 300);
    }
  }

  const activeSlug = pinnedSlug ?? spySlug;
  return (
    <div className="min-h-screen pb-12">
      <MenuHero />
      {showClosedBanner && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          <p className="font-semibold text-amber-900">We're currently closed</p>
          {/* Structured Weekly Schedule */}
          <ul className="mt-2 space-y-0.5 border-y border-amber-200/60 py-2">
            {hoursLines.map((line) => (
              <li
                key={line.label}
                className="flex justify-between max-w-[11rem]"
              >
                <span className="font-medium text-amber-900">{line.label}</span>
                <span className="text-amber-700">{line.hours}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-700">
            Checkout is disabled until standard operating hours resume.
          </p>
        </div>
      )}
      <CategoryChips 
        categories={categories}
        activeSlug={activeSlug}
        onCategorySelect={handleCategorySelect} 
      />
      <main className="pb-4">
        {categories.map((cat) => (
          <section 
            key={cat.id} 
            id={`section-${cat.slug}`}
            className="border-b border-gray-200"
          >
            <h2 className="text-xl font-bold px-4 py-2">{cat.name}</h2>
            <ul className="divide-y divide-gray-200 border-t border-gray-200">
              {cat.items.map((item) => (
                <MenuItemRow
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price_cents={item.price_cents}
                  is_available={item.is_available}
                  onOpen={() => openItemSheet(item)}
                />
              ))}
            </ul>
          </section>
        ))}
      </main>
      <MenuItemSheet
        item={selectedItem}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  );
}