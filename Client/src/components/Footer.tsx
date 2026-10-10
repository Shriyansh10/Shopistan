/*
 * Journal — src/components/Footer.tsx
 *
 * 2026-10-09 (Claude): Created. Footer moved here unchanged from app/(public)/DepartmentHome.tsx so the product
 *   page can share it. Links are still plain text (no pages behind them yet).
 */

import { Brand } from "./Header";

const columns = [
  { title: "Shop", items: ["New arrivals", "Best sellers", "Deals", "Gift cards"] },
  { title: "Help", items: ["Track order", "Returns", "Shipping", "Contact us"] },
  { title: "Company", items: ["About", "Careers", "Press", "Privacy"] },
];

export default function Footer() {
  return (
    <footer className="bg-ink pt-18 pb-10 text-subtle">
      <div className="mx-auto max-w-300 px-4 xl:px-0">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 text-white md:col-span-1">
            <Brand />
            <p className="mt-4 text-sm text-subtle">Everyday essentials, delivered fast across India.</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold text-white">{col.title}</h4>
              {col.items.map((item) => (
                <p key={item} className="mb-3 text-sm">{item}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-gray-800 pt-7 text-[13px]">
          <span>© 2026 Shopistan. All rights reserved.</span>
          <div className="flex gap-2">
            {["VISA", "UPI", "MCARD", "COD"].map((p) => (
              <span key={p} className="grid h-6.5 place-items-center rounded-md bg-gray-800 px-3 text-[11px] font-semibold text-gray-300">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
