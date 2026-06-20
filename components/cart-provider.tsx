"use client";

import { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { ACCESSORIES } from '@/lib/accessories';

export type CartItem = {
  id: string;
  name: string;
  price_cents: number;
  quantity: number;
}

export type AccessoryQuantity = Record<string, number>;

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  hasLoaded: boolean;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
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
      setItems(parsed.items ?? []);
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
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== id));
  }

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    } 
    setItems((prevItems) =>
      prevItems.map((i) => (i.id === id ? { ...i, quantity } : i ))
    );
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