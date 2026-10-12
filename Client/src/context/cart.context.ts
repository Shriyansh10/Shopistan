import { createContext, useContext } from "react";

export type CartCountValue = {
  count: number; // total units in the cart; 0 for guests
  refreshCount: () => Promise<void>;
};

export const CartCountContext = createContext<CartCountValue | null>(null);

export function useCartCount() {
  const value = useContext(CartCountContext);
  if (!value) throw new Error("useCartCount must be used inside <CartProvider>");
  return value;
}
