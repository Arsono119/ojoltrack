"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/riwayat", label: "Riwayat", icon: "📋" },
  { href: "/grafik", label: "Grafik", icon: "📊" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-10 border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-md">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${active ? "text-green-600" : "text-zinc-500"}`}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
        <Link
          href="/tambah"
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-bold text-white bg-green-600 rounded-t-lg -mt-1"
        >
          <span className="text-lg">＋</span>Tambah
        </Link>
      </div>
    </nav>
  );
}
