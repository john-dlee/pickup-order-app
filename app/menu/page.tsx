import { createSupabaseClient } from '@/lib/supabase/client';

export default async function MenuPage() {
  const supabase = createSupabaseClient();
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('*')
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (items.length === 0) {
    return <div>No items found</div>;
  }

  return (
    <main>
      <h1>Menu</h1>
      <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name} - ${(item.price_cents / 100).toFixed(2)}
        </li>
      ))}
      </ul>
    </main>
  );
}
