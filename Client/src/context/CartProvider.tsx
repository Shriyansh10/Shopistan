/*
 * Journal — src/context/CartProvider.tsx
 *
 * 2026-10-10 (Claude): Created. Holds the cart badge count (GET /cart/count = total units) for the whole app.
 *   Must sit inside AuthProvider: it loads the count when someone is logged in (on load and right after login)
 *   and shows 0 for guests. The count is remembered per user, so after logout/login as someone else the old
 *   number never shows. refreshCount() re-asks the server; pages call it after adding/changing/removing items.
 *   A failed count request just leaves the badge as it was — it's not worth an error message.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth.context";
import { CartCountContext } from "./cart.context";
import { getCartCount } from "../services/cart.service";

export default function CartProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const [saved, setSaved] = useState<{ userId: string; count: number } | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    let ignore = false;
    getCartCount()
      .then((count) => !ignore && setSaved({ userId: user.id, count }))
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [status, user]);

  const refreshCount = useCallback(async () => {
    if (!user) return;
    try {
      setSaved({ userId: user.id, count: await getCartCount() });
    } catch {
      // keep the current number
    }
  }, [user]);

  const count = status === "authenticated" && user && saved?.userId === user.id ? saved.count : 0;
  const value = useMemo(() => ({ count, refreshCount }), [count, refreshCount]);

  return <CartCountContext.Provider value={value}>{children}</CartCountContext.Provider>;
}
