import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import AuthProvider from "./context/AuthProvider";
import CartProvider from "./context/CartProvider";
import RequireAuth from "./components/RequireAuth";
import DepartmentHome from "./app/(public)/DepartmentHome";
import ProductPage from "./app/(public)/product/ProductDetail";
import Search from "./app/(public)/Search";
import Login from "./app/(auth)/Login";
import Register from "./app/(auth)/Register";
import VerifyOtp from "./app/(auth)/VerifyOtp";
import ProfileSettings from "./app/(protected)/settings/ProfileSettings";
import Wishlist from "./app/(protected)/Wishlist";
import Cart from "./app/(protected)/Cart";
import Checkout from "./app/(protected)/Checkout";
import Orders from "./app/(protected)/Orders";
import OrderDetails from "./app/(protected)/OrderDetails";
import Payment from "./app/(protected)/Payment";
import RequireAdmin from "./components/RequireAdmin";
import AdminDashboard from "./app/(admin)/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* public */}
            <Route path="/" element={<DepartmentHome />} />
            <Route path="/product/:productId" element={<ProductPage />} />
            <Route path="/search" element={<Search />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/verify-otp" element={<VerifyOtp />} />

            {/* login required — guests are sent to /auth/login?next=<page> */}
            <Route element={<RequireAuth />}>
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/order/:orderId" element={<OrderDetails />} />
              <Route path="/pay/:orderId" element={<Payment />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/settings/profile" element={<ProfileSettings />} />
            </Route>

            {/* admins only — others are sent home (guests to login) */}
            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminDashboard />} />
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
