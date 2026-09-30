/*
 * Journal — src/app/(auth)/AuthLayout.tsx
 *
 * 2026-09-26 (Claude): Created from Figma "Web / 02 — Create account" (node 8:47). Split-screen shell for auth
 *   pages: dark brand panel (logo, glow, heading/pitch via props, footer) on the left, form slot on the right.
 *   Brand panel hides below lg; the logo then sits above the form inside the same 400px column.
 */

import type { ReactNode } from "react";
import glow from "../../assets/brand/glow.svg";
import mark from "../../assets/brand/mark.svg";

type AuthLayoutProps = {
  heading: string;
  pitch: string;
  children: ReactNode;
};

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src={mark} alt="" width={40} height={40} />
      <span className="text-2xl leading-none font-bold">
        <span className="tracking-[-0.72px]">shopistan</span>
        <span className="text-brand">.</span>
      </span>
    </div>
  );
}

// Split screen shared by the auth pages: dark brand panel on the left, form on the right
export default function AuthLayout({ heading, pitch, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh bg-white font-sans">
      <aside className="relative hidden w-140 shrink-0 flex-col justify-between overflow-hidden bg-ink p-14 text-white lg:flex">
        <img
          src={glow}
          alt=""
          className="pointer-events-none absolute -bottom-77.5 -left-70 max-w-none"
        />
        <div className="relative">
          <Brand />
        </div>
        <div className="relative flex flex-col gap-4">
          <h1 className="text-[40px] leading-[1.2] font-bold tracking-[-1.2px]">{heading}</h1>
          <p className="text-base leading-[1.55] text-subtle">{pitch}</p>
        </div>
        <p className="relative text-[13px] text-muted">© 2026 Shopistan</p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:p-12">
        <div className="w-full max-w-100">
          <div className="mb-10 text-ink lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
