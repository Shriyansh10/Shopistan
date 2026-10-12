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
