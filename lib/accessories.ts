export type Accessory = {
  id: string;
  name: string;
  price_cents: number;
  maxQuantity: number;
}

export const ACCESSORIES: Accessory[] = [
  { id: "soy_sauce", name: "Soy sauce", price_cents: 0, maxQuantity: 5 },
  { id: "chopsticks", name: "Chopsticks", price_cents: 0, maxQuantity: 5 },
  { id: "mayo", name: "Spicy mayo", price_cents: 150, maxQuantity: 3 },
]

