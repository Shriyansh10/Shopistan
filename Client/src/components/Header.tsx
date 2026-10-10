/*
 * Journal — src/components/Header.tsx
 *
 * 2026-10-08 (Claude): Created. Brand + Header moved here from app/(public)/DepartmentHome.tsx so every
 *   storefront page shares them. Added the account area on the right, driven by useAuth():
 *   - checking      → empty placeholder (no "Guest" flash before the session check finishes)
 *   - guest         → "Guest" label + Sign in button (→ /auth/login?next=<current page>)
 *   - authenticated → initials avatar + first name; click opens a menu with name/email, Settings, Log out.
 *     Log out on a protected page (cart/wishlist/settings) first goes home, so RequireAuth doesn't send the
 *     user to login; on any other page it stays put.
 *   Cart and wishlist are plain links; RequireAuth asks guests to sign in when they open them.
 *   Search is still visual only.
 *
 * 2026-10-10 (Claude): Cart icon shows a badge with the total units in the cart (useCartCount → GET /cart/count),
 *   as in the Figma cart/wishlist frames. Hidden at 0 and for guests; shows "99+" above 99.
 */

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import mark from "../assets/brand/mark.svg";
import { useAuth } from "../context/auth.context";
import { useCartCount } from "../context/cart.context";

const PROTECTED_PREFIXES = ["/cart", "/wishlist", "/settings"];

const iconButtonClass =
  "grid size-11 shrink-0 place-items-center rounded-[10px] border border-line text-ink transition hover:border-ink";

export function Brand() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5">
      <img src={mark} alt="" width={36} height={36} />
      <span className="text-xl leading-none font-bold tracking-[-0.6px]">
        shopistan<span className="text-brand">.</span>
      </span>
    </Link>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const initials = `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // leave protected pages first, otherwise RequireAuth would redirect to login once we're a guest
    if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) navigate("/", { replace: true });
    await logout();
    setIsLoggingOut(false);
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 items-center gap-2 rounded-[10px] border border-line pr-3 pl-1.5 transition hover:border-ink"
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-semibold md:block">{user.first_name}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-white shadow-[0_12px_32px_rgba(17,24,39,0.12)]"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold">
              {user.first_name} {user.last_name}
            </p>
            <p className="truncate text-[13px] text-muted">{user.email_id}</p>
          </div>
          <Link
            to="/settings/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm hover:bg-surface"
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="block w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-surface disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}

function AccountArea() {
  const { status } = useAuth();
  const { pathname, search } = useLocation();

  if (status === "checking") return <div className="h-11 w-24" aria-hidden="true" />;
  if (status === "authenticated") return <UserMenu />;

  return (
    <div className="flex items-center gap-3">
      <span className="hidden items-center gap-1.5 text-sm text-muted md:flex">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
        Guest
      </span>
      <Link
        to={`/auth/login?next=${encodeURIComponent(pathname + search)}`}
        className="grid h-11 place-items-center rounded-[10px] bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
      >
        Sign in
      </Link>
    </div>
  );
}

export default function Header() {
  const { count: cartCount } = useCartCount();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white">
      <div className="mx-auto flex h-18 max-w-300 items-center gap-6 px-4 xl:px-0">
        <Brand />

        {/* search — visual only for now */}
        <label className="hidden h-11 flex-1 items-center gap-2.5 rounded-[10px] border border-line bg-surface px-4 text-sm text-subtle sm:flex">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            type="search"
            placeholder="Search for products, brands and more"
            className="flex-1 bg-transparent text-ink outline-none placeholder:text-subtle"
          />
        </label>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:ml-0">
          <Link to="/wishlist" aria-label="Wishlist" className={iconButtonClass}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" /></svg>
          </Link>
          <Link
            to="/cart"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}` : "Cart"}
            className={`relative ${iconButtonClass}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="13" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
            {/* badge: total units in the cart (hidden when 0 / for guests) */}
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-[9px] bg-brand px-1 text-[10px] leading-none font-bold text-white"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <AccountArea />
        </div>
      </div>
    </header>
  );
}
