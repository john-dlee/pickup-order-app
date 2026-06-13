"use client"

import { useCart } from "@/components/cart-provider";
import { ShoppingCart } from "lucide-react";

export default function CartButton({ onClick }: { onClick: () => void }) {
  const { items } = useCart();

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
      aria-label="Open Cart"
    >
      <ShoppingCart className="w-6 h-6" />

      {totalItemsCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-between justify-center">
          {totalItemsCount}
        </span>
      )} 
    </button>
  );
}