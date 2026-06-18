"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

export function ClearCartOnMount() {
  const { clearCart } = useCart();
  // Once after payment — empty deps avoids re-running when provider re-renders
  useEffect(() => {
    clearCart();
  }, []);
  return null;
}