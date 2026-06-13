"use client"

import { useCart } from "@/components/cart-provider";

type MenuItemRowProps = {
  id: string;
  name: string;
  price_cents: number;
};

export default function MenuItemRow({ id, name, price_cents }: MenuItemRowProps) {
  const { addItem } = useCart();

  const formattedPrice = (price_cents / 100).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD"
  });

  return (
    <div>
      <span>{name} - {formattedPrice}</span>
      <button onClick={() => addItem({ id, name, price_cents })}>
        Add to cart
      </button>
    </div>
  )
}