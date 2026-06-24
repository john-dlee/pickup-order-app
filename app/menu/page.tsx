import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { MenuCategory } from "@/lib/menu_types";
import { MenuContent } from '@/components/menu/menu-content';
import { assignCategorySlug } from '@/lib/category-slug';

export const revalidate = 60;

export default async function MenuPage() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      id, 
      name, 
      price_cents,
      sort_order,
      is_available,
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
  const usedSlugs = new Set<string>();

  for (const row of data) {
    const cat = row.categories;

    if (!cat) continue;

    if (!categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: assignCategorySlug(cat.name, cat.id, usedSlugs),
        sort_order: cat.sort_order,
        items: [],
      });
    }

    categoryMap.get(cat.id)!.items.push({
      id: row.id,
      name: row.name,
      price_cents: row.price_cents,
      sort_order: row.sort_order,
      is_available: row.is_available,
    });
  }

  const categories = [...categoryMap.values()]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((cat) => ({
      ...cat,
      items: cat.items.sort((a, b) => a.sort_order - b.sort_order),
    }));
  
  return (
    <main className='mx-auto max-w-md bg-white shadow-lg'>
      <MenuContent categories={categories} />
    </main>
  );
}
