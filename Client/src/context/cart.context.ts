/*
 * Journal — src/context/cart.context.ts
 *
 * 2026-10-10 (Claude): Created. Shared cart-count context and the useCartCount() hook, for the header badge.
 *   The provider lives in CartProvider.tsx (kept separate because React Fast Refresh needs component files to
 *   export only components). Anything that changes the cart calls refreshCount() afterwards.
 *   Usage: const { count, refreshCount } = useCartCount();
 */

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
