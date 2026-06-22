export type MenuItem = {
  id: string;
  name: string;
  price_cents: number;
  sort_order: number;
}

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  items: MenuItem[];
}