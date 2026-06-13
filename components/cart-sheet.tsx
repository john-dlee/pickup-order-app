"use client"

import { useCart } from "@/components/cart-provider";
import { ShoppingCart } from "lucide-react";
import { 
  Sheet, 
  SheetContent,
  SheetTitle,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function CartSheet() {
  const { items, updateItemQuantity, totalCents } = useCart();
  
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <ShoppingCart size={20} />
          <span>({totalItemsCount})</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>My Cart</SheetTitle>
        </SheetHeader>

        <div>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", gap: "10px", margin: "10px 0"}}>              
              <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)}>+</button>
              <span>{item.name}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "20px", fontWeight: "bold"}}>
          Subtotal: ${(totalCents / 100).toFixed(2)}
        </div>
      </SheetContent>
    </Sheet>
  );
}