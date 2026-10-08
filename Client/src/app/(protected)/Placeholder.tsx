/*
 * Journal — src/app/(protected)/Placeholder.tsx
 *
 * 2026-10-08 (Claude): Created. Temporary page for protected sections that aren't built yet (cart, wishlist),
 *   so the sign-in → return flow works end to end. Usage: <Placeholder title="Your cart" message="..." />
 */

import { Link } from "react-router";
import Header from "../../components/Header";

type PlaceholderProps = {
  title: string;
  message: string;
};

export default function Placeholder({ title, message }: PlaceholderProps) {
  return (
    <div className="min-h-svh bg-surface font-sans text-ink antialiased">
      <Header />

      <main className="mx-auto flex max-w-300 flex-col items-center px-4 py-24 text-center xl:px-0">
        <h1 className="text-4xl leading-[1.1] font-bold tracking-[-1.2px]">{title}</h1>
        <p className="mt-3 text-[15px] text-muted">{message}</p>
        <Link
          to="/"
          className="mt-8 rounded-[10px] bg-brand px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-hover"
        >
          Continue shopping
        </Link>
      </main>
    </div>
  );
}
