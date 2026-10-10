/*
 * Journal — src/App.tsx
 *
 * Before: Vite starter placeholder rendering "Hello World" (imported a missing App.css, later removed by user).
 *
 * 2026-09-26 (Claude): Added a minimal BrowserRouter with a single /register route; every other path
 *   redirects to /register. Temporary — replace with the full route tree (layouts + ProtectedRoute/AdminRoute).
 *
 * 2026-09-27 (Claude): Added the /verify-otp route (VerifyOtp page).
 *
 * 2026-09-29 (Claude): Added the /auth/login route (Login page); unknown paths now redirect to login.
 *
 * 2026-09-30 (Claude): Added /profile (Profile page) — a test page for the access/refresh token flow.
 *
 * 2026-10-08 (Claude): Added the public home route "/" (DepartmentHome). Unknown paths now redirect to "/"
 *   instead of the login page.
 *
 * 2026-10-08 (Claude): Wrapped the app in AuthProvider (shared login state). Protected routes sit inside the
 *   RequireAuth layout route: /cart and /wishlist (placeholders for now) and /settings/profile (the old Profile
 *   page). /profile and /settings redirect to /settings/profile.
 *
 * 2026-10-09 (Claude): Added the public product page route /product/:productId (ProductPage).
 *
 * 2026-10-09 (Claude): /wishlist now renders the real Wishlist page instead of the placeholder (still protected).
 *
 * 2026-10-10 (Claude): /cart now renders the real Cart page (still protected). Placeholder is no longer used.
 *
 * 2026-10-10 (Claude): Wrapped the routes in CartProvider (inside AuthProvider) for the header cart badge.
 *   Deleted app/(protected)/Placeholder.tsx (unused since /cart and /wishlist became real pages).
 */

import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import AuthProvider from "./context/AuthProvider";
import CartProvider from "./context/CartProvider";
import RequireAuth from "./components/RequireAuth";
import DepartmentHome from "./app/(public)/DepartmentHome";
import ProductPage from "./app/(public)/product/ProductDetail";
import Login from "./app/(auth)/Login";
import Register from "./app/(auth)/Register";
import VerifyOtp from "./app/(auth)/VerifyOtp";
import ProfileSettings from "./app/(protected)/settings/ProfileSettings";
import Wishlist from "./app/(protected)/Wishlist";
import Cart from "./app/(protected)/Cart";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* public */}
            <Route path="/" element={<DepartmentHome />} />
            <Route path="/product/:productId" element={<ProductPage />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/verify-otp" element={<VerifyOtp />} />

            {/* login required — guests are sent to /auth/login?next=<page> */}
            <Route element={<RequireAuth />}>
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/settings/profile" element={<ProfileSettings />} />
            </Route>

            <Route path="/profile" element={<Navigate to="/settings/profile" replace />} />
            <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
