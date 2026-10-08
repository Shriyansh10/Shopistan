/*
 * Journal — src/context/AuthProvider.tsx
 *
 * 2026-10-08 (Claude): Created. Wraps the app and owns the login state shared by every page:
 *   - on load, asks the server if someone is logged in (GET /auth/profile; the axios interceptor silently
 *     refreshes an expired access token). Success → "authenticated" + user, failure → "guest". Never redirects.
 *   - refresh(): re-runs that check (Login calls it after a successful login).
 *   - logout(): POST /auth/logout, then becomes "guest" even if the request failed, so the UI never stays
 *     stuck showing a logged-in user.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProfile, logoutUser, type Profile } from "../services/auth.service";
import { AuthContext, type AuthStatus } from "./auth.context";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<Profile | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getProfile();
      setUser(res.data);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("guest");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setStatus("guest");
    }
  }, []);

  // session check once on load
  useEffect(() => {
    let ignore = false;
    getProfile()
      .then((res) => {
        if (ignore) return;
        setUser(res.data);
        setStatus("authenticated");
      })
      .catch(() => {
        if (ignore) return;
        setUser(null);
        setStatus("guest");
      });
    return () => {
      ignore = true;
    };
  }, []);

  const value = useMemo(() => ({ status, user, refresh, logout }), [status, user, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
