/*
 * Journal — src/components/RequireAuth.tsx
 *
 * 2026-10-08 (Claude): Created. Route guard for pages that need login (cart, wishlist, settings). Used as a
 *   layout route in App.tsx: <Route element={<RequireAuth />}> ...protected routes... </Route>.
 *   - checking      → small loading screen (avoids flashing login before the session check finishes)
 *   - guest         → /auth/login?next=<this page>, with a message in router state for the login page
 *   - authenticated → renders the page (<Outlet />)
 */

import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/auth.context";

export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "checking") {
    return (
      <div className="grid min-h-svh place-items-center font-sans text-sm text-muted">Loading...</div>
    );
  }

  if (status === "guest") {
    const next = encodeURIComponent(location.pathname + location.search);
    return (
      <Navigate
        to={`/auth/login?next=${next}`}
        replace
        state={{ message: "Please sign in to continue." }}
      />
    );
  }

  return <Outlet />;
}
