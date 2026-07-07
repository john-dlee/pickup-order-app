import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { MenuCategory, ModifierGroup } from "@/lib/menu_types";
import { MenuContent } from '@/components/menu/menu-content';
import { assignCategorySlug } from '@/lib/category-slug';

export const revalidate = 60;

export default async function MenuPage() {
  const supabase = createSupabaseServerClient();
  const [
    { data: menuRows, error: itemsError },
    { data: groups, error: groupsError },
    { data: options, error: optionsError },
    { data: links, error: linksError },
  ] = await Promise.all([
    supabase
    .from('menu_items')
    .select(`
      id, 
      name, 
      price_cents,
      sort_order,
      is_available,
      description,
      categories (
        id,
        name,
        sort_order
      )
    `),
    supabase.from("modifier_groups").select("id, name, required, sort_order"),
    supabase.from("modifier_options").select("id, group_id, name, sort_order"),
    supabase.from("menu_item_modifier_groups").select("menu_item_id, group_id"),
  ]);

  if (itemsError || groupsError || optionsError || linksError) {
    const err = itemsError ?? groupsError ?? optionsError ?? linksError;
    return <div>Error: {err?.message}</div>;
  }

  if (!menuRows?.length) {
    return <div>No items found</div>;
  }

  const groupMap = new Map<string, ModifierGroup>();

  for (const g of groups ?? []) {
    groupMap.set(g.id, {
      id: g.id,
      name: g.name,
      required: g.required,
      sort_order: g.sort_order,
      options: [],
    })
  }

  for (const o of options ?? []) {
    groupMap.get(o.group_id)?.options.push({
      id: o.id,
      name: o.name,
      sort_order: o.sort_order,
    });
  }

  for (const g of groupMap.values()) {
    g.options.sort((a, b) => a.sort_order - b.sort_order);
  }

  const groupByItemId = new Map<string, ModifierGroup[]>();

  for (const link of links ?? []) {
    const group = groupMap.get(link.group_id);
    if (!group) continue;

    const list = groupByItemId.get(link.menu_item_id) ?? [];
    list.push(group);
    groupByItemId.set(link.menu_item_id, list);
  }

  for (const list of groupByItemId.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }

  const categoryMap = new Map<string, MenuCategory>();
  const usedSlugs = new Set<string>();

  for (const row of menuRows) {
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
      description: row.description,
      modifierGroups: groupByItemId.get(row.id) ?? [],
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
