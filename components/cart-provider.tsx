"use client";

import { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { ACCESSORIES } from '@/lib/accessories';
import { MAX_DISTINCT_MENU_ITEMS } from '@/lib/cart-limits';
import type { ModifierSelections } from "@/lib/menu_types";
import {
  EMPTY_SELECTIONS,
  normaliseSelections,
  cartLineKey,
  sameCartLine,
} from "@/lib/cart-lines";

export type CartItem = {
  id: string;
  name: string;
  price_cents: number;
  quantity: number;
  selections: ModifierSelections;          
  selectionLabels?: Record<string, string>;
}

export type AccessoryQuantity = Record<string, number>;

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  hasLoaded: boolean;
  removeItem: (id: string, selections?: ModifierSelections) => void;
  updateItemQuantity: (id: string, quantity: number, selections?: ModifierSelections) => void;
  getItemQuantity: (id: string, selections?: ModifierSelections) => number;
  clearCart: () => void;

  // Accessories state
  accessoryQuantity: AccessoryQuantity;
  updateAccessoryQuantity: (id: string, quantity: number) => void;
  getAccessoryQuantity: (id: string) => number;

  // Order price breakdown
  accessoriesTotalCents: number;
  totalCents: number;             // Menu items total
  orderTotalCents: number;
}

const CART_STORAGE_KEY = "pickup_cart";

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [accessoryQuantity, setAccessoryQuantity] = useState<AccessoryQuantity>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setItems(parsed.items ?? [] );
      setAccessoryQuantity(parsed.accessoryQuantity ?? {});
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items, accessoryQuantity }));
  }, [items, accessoryQuantity, hasLoaded]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => sameCartLine(i, item));

      if (!existingItem && prevItems.length >= MAX_DISTINCT_MENU_ITEMS) {
        return prevItems;
      }

      if (existingItem) {
        return prevItems.map((i) => sameCartLine(i, item)
          ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string, selections = EMPTY_SELECTIONS) => {
    setItems((prevItems) => prevItems.filter((i) => !sameCartLine(i, { id, selections })));
  }

  const updateItemQuantity = (id: string, quantity: number, selections = EMPTY_SELECTIONS) => {
    if (quantity <= 0) {
      removeItem(id, selections);
      return;
    } 
    setItems((prevItems) =>
      prevItems.map((i) => sameCartLine(i, { id, selections }) ? { ...i, quantity } : i ));
  }

  const clearCart = () => {
    setItems([]);
    setAccessoryQuantity({});
    localStorage.removeItem(CART_STORAGE_KEY)
  };

  const updateAccessoryQuantity = (id: string, quantity: number) => {
    const accessory = ACCESSORIES.find((a) => a.id === id);
    if (!accessory) return;

    const clamped = Math.min(accessory.maxQuantity, Math.max(0, quantity));

    setAccessoryQuantity((prev) => {
      if (clamped === 0) {
        const { [id]: _ , ...rest } = prev;
        return rest;
      } 
      return { ...prev, [id]: clamped}
    });
  };

  const getAccessoryQuantity = (id: string) => (accessoryQuantity[id] ?? 0);

  const getItemQuantity = (id: string, selections = EMPTY_SELECTIONS) => 
    items.find((i) => sameCartLine(i, { id, selections }))?.quantity ?? 0;

  const totalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0),
    [items]
  );

  const accessoriesTotalCents = useMemo(
    () => ACCESSORIES.reduce(
      (sum, a) => sum + (accessoryQuantity[a.id] ?? 0) * a.price_cents, 
      0
    ),
    [accessoryQuantity]
  );

  const orderTotalCents = totalCents + accessoriesTotalCents;

  const value = { 
    items, 
    hasLoaded,
    addItem, 
    removeItem, 
    updateItemQuantity, 
    getItemQuantity,
    clearCart, 
    accessoryQuantity,
    updateAccessoryQuantity,
    getAccessoryQuantity,
    accessoriesTotalCents,
    orderTotalCents,
    totalCents
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) {
      throw new Error("useCart must be used within CartProvider");
    }
    return ctx;
  }