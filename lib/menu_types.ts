export type MenuItem = {
  id: string;
  name: string;
  price_cents: number;
  sort_order: number;
  is_available: boolean;
  description: string | null;
  modifierGroups: ModifierGroup[];
}

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  items: MenuItem[];
}

export type ModifierOption = {
  id: string;
  name: string;
  sort_order: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  sort_order: number;
  options: ModifierOption[];
};

export type ModifierSelections = Record<string, string>;
