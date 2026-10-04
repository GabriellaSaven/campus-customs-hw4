import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  product_id: string;
  name: string;
  image_url: string;
  price: number;
  size: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (product_id: string, size: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "cc_cart";
const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartState>(() => {
    return {
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      total: items.reduce((s, i) => s + i.qty * i.price, 0),
      add: (item, qty = 1) =>
        setItems((cur) => {
          const idx = cur.findIndex(
            (i) => i.product_id === item.product_id && i.size === item.size,
          );
          if (idx >= 0) {
            const next = [...cur];
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return next;
          }
          return [...cur, { ...item, qty }];
        }),
      remove: (product_id, size) =>
        setItems((cur) =>
          cur.filter((i) => !(i.product_id === product_id && i.size === size)),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
