import { createSupabaseClient } from '@/lib/supabase/client';
import MenuItemRow from '@/components/menu-item-row';
import CheckoutBar from '@/components/checkout-bar';

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
      <CheckoutBar />
      <ul>
        {items.map((item) => (
          <MenuItemRow 
            key={item.id}
            id={item.id} 
            name={item.name} 
            price_cents={item.price_cents} 
          />
        ))}
      </ul>
    </main>
  );
}
