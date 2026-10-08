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
 */

import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import AuthProvider from "./context/AuthProvider";
import RequireAuth from "./components/RequireAuth";
import DepartmentHome from "./app/(public)/DepartmentHome";
import Login from "./app/(auth)/Login";
import Register from "./app/(auth)/Register";
import VerifyOtp from "./app/(auth)/VerifyOtp";
import ProfileSettings from "./app/(protected)/settings/ProfileSettings";
import Placeholder from "./app/(protected)/Placeholder";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* public */}
          <Route path="/" element={<DepartmentHome />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/verify-otp" element={<VerifyOtp />} />

          {/* login required — guests are sent to /auth/login?next=<page> */}
          <Route element={<RequireAuth />}>
            <Route
              path="/cart"
              element={<Placeholder title="Your cart" message="Your cart is empty. Items you add will show up here." />}
            />
            <Route
              path="/wishlist"
              element={<Placeholder title="Your wishlist" message="Nothing saved yet. Products you save will show up here." />}
            />
            <Route path="/settings/profile" element={<ProfileSettings />} />
          </Route>

          <Route path="/profile" element={<Navigate to="/settings/profile" replace />} />
          <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
