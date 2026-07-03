export type Accessory = {
  id: string;
  name: string;
  price_cents: number;
  maxQuantity: number;
}

export const ACCESSORIES: Accessory[] = [
  { id: "soy_sauce", name: "Soy sauce", price_cents: 0, maxQuantity: 5 },
  { id: "wasabi", name: "Wasabi", price_cents: 0, maxQuantity: 5 },
  { id: "chopsticks", name: "Chopsticks", price_cents: 0, maxQuantity: 5 },
  { id: "mayo", name: "Mayo", price_cents: 50, maxQuantity: 5 },
  { id: "spicy_mayo", name: "Spicy mayo", price_cents: 100, maxQuantity: 5 },
  { id: "sweet_chilli", name: "Sweet chilli", price_cents: 50, maxQuantity: 5 },
  { id: "ginger", name: "Ginger", price_cents: 100, maxQuantity: 5 },
]

