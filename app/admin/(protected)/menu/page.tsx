"use client";

import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { XIcon } from "lucide-react";

const supabase = createSupabaseClient();

type MenuItemRow = {
  id: string;
  name: string;
  is_available: boolean;
  sort_order: number;
  categories: {
    name: string;
    sort_order: number;
  } | null;
};

type GroupedCategory = {
  name: string;
  sort_order: number;
  items: MenuItemRow[];
};

function groupByCategory(items: MenuItemRow[]): GroupedCategory[] {
  const map = new Map<string, GroupedCategory>();

  for (const item of items) {
    const catName = item.categories?.name ?? "Other";
    const catSort = item.categories?.sort_order ?? 999;

    if (!map.has(catName)) {
      map.set(catName, { name: catName, sort_order: catSort, items: [] });
    }

    map.get(catName)!.items.push(item);
  }

  return [...map.values()]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.sort_order - b.sort_order),
    }));
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const grouped = groupByCategory(items);

  const normalisedQuery = searchQuery.trim().toLowerCase();

  const filteredGroup = normalisedQuery
    ? grouped
      .map((group) => ({
        ...group, 
        items: group.items.filter((item) => 
          item.name.toLowerCase().includes(normalisedQuery)
      ),
      }))
      .filter((group) => group.items.length > 0)
    : grouped;

  const loadItems = useCallback(async () => {
    setLoadError("");

    const { data, error: fetchError } = await supabase
      .from("menu_items")
      .select(`
        id,
        name,
        is_available,
        sort_order,
        categories (
          name,
          sort_order
        )
      `);

    if (fetchError) {
      setLoadError(fetchError.message);
      return;
    }

    setItems((data as MenuItemRow[]) ?? []);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function toggleAvailability(item: MenuItemRow) {
    setTogglingId(item.id);
    setLoadError("");

    const nextAvailable = !item.is_available;

    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, is_available: nextAvailable } : row
      )
    );

    const { error: updateError } = await supabase
      .from("menu_items")
      .update({ is_available: nextAvailable })
      .eq("id", item.id);

    setTogglingId(null);

    if (updateError) {
      setLoadError(updateError.message);
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, is_available: item.is_available } : row
        )
      );
    }
  }

  const availableCount = items.filter((item) => item.is_available).length;
  const soldOutCount = items.filter((item) => !item.is_available).length;

  return (
    <main className="w-full border rounded-xl">
      <div className="flex items-center justify-between p-4 gap-4 border-b">
        <h1 className="text-xl font-bold">Menu</h1>
        <Link href="/admin/orders" className="text-sm text-gray-600 underline">
          Kitchen
        </Link>
      </div>

      <div className="flex gap-1 border-b">
        <div className="flex flex-col border-r px-4 py-2">
          <span className="text-md font-medium text-gray-500">Available</span>
          <span className="text-2xl font-bold tabular-nums text-[#047857]">
            {availableCount}
          </span>
        </div>
        <div className="flex flex-col border-r px-4 py-2">
          <span className="text-md font-medium text-gray-500">Sold out</span>
          <span className="text-2xl font-bold tabular-nums text-[#b45309]">
            {soldOutCount}
          </span>
        </div>
      </div>
      <div className="px-4 pt-4">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search items…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Clear search"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        {normalisedQuery && filteredGroup.length === 0 && (
          <p className="mt-2 text-sm text-gray-600">
            No items match “{searchQuery.trim()}”
          </p>
        )}
      </div>
      <p className="px-4 pt-4 text-sm text-gray-600">
        Tap to mark items sold out or available again.
      </p>

      {loadError && (
        <p className="mt-2 px-4 text-sm text-red-600">{loadError}</p>
      )}

      {grouped.length === 0 && !loadError && (
        <p className="mt-4 px-4 text-sm text-gray-600">No menu items found.</p>
      )}

      <div className="p-4 flex flex-col gap-4">
        {filteredGroup.map((group) => (
          <section key={group.name} className="overflow-hidden rounded-xl border">
            <h2 className="border-b bg-gray-100 px-4 py-2.5 text-base font-bold text-gray-800">
              {group.name}
            </h2>
            <ul className="divide-y">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span
                    className={
                      item.is_available
                        ? "text-sm font-medium text-gray-900"
                        : "text-sm font-medium text-gray-500 line-through"
                    }
                  >
                    {item.name}
                  </span>
                  <Button
                    type="button"
                    variant={item.is_available ? "outline" : "default"}
                    size="sm"
                    className={
                      item.is_available
                        ? "shrink-0 text-md font-semibold"
                        : "shrink-0 text-md font-semibold bg-[#047857] hover:bg-[#047857]/90"
                    }
                    disabled={togglingId === item.id}
                    onClick={() => toggleAvailability(item)}
                  >
                    {item.is_available ? "Sold out" : "Available"}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
