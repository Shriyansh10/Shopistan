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
