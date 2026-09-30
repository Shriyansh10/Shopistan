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
 */

import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Login from "./app/(auth)/Login";
import Register from "./app/(auth)/Register";
import VerifyOtp from "./app/(auth)/VerifyOtp";
import Profile from "./app/(protected)/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/verify-otp" element={<VerifyOtp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
