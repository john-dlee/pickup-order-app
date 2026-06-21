import { createSupabaseClient } from '@/lib/supabase/client';
import type { MenuCategory } from "@/lib/menu_types";
import { MenuContent } from '@/components/menu/menu-content';

export default async function MenuPage() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      id, 
      name, 
      price_cents,
      sort_order,
      categories (
        id,
        name,
        sort_order
      )
    `);
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data?.length) {
    return <div>No items found</div>;
  }

  const categoryMap = new Map<string, MenuCategory>();

  for (const row of data) {
    const cat = row.categories;

    // change this later
    if (!cat || Array.isArray(cat)) continue;

    if (!categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        sort_order: cat.sort_order,
        items: [],
      });
    }

    categoryMap.get(cat.id)!.items.push({
      id: row.id,
      name: row.name,
      price_cents: row.price_cents,
      sort_order: row.sort_order,
    });
  }

  const categories = [...categoryMap.values()]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((cat) => ({
      ...cat,
      items: cat.items.sort((a, b) => a.sort_order - b.sort_order),
    }));
  
  return <MenuContent categories={categories} />;
}
