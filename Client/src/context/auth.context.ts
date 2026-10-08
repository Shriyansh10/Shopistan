/*
 * Journal — src/context/auth.context.ts
 *
 * 2026-10-08 (Claude): Created. The shared "who is logged in" context and the useAuth() hook to read it.
 *   The provider that fills it lives in AuthProvider.tsx (kept separate because React Fast Refresh needs
 *   component files to export only components).
 *   status: "checking" (session check in flight) → "guest" | "authenticated".
 *   Usage: const { status, user, logout } = useAuth();
 */

import { createContext, useContext } from "react";
import type { Profile } from "../services/auth.service";

export type AuthStatus = "checking" | "guest" | "authenticated";

export type AuthContextValue = {
  status: AuthStatus;
  user: Profile | null;
  refresh: () => Promise<void>; // re-check the session, e.g. right after login
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
