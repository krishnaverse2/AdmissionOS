"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/colleges", label: "Colleges", icon: "🏛️" },
  { href: "/compare", label: "Compare", icon: "📊" },
  { href: "/counselor", label: "AI", icon: "🤖" },
  { href: "/saved", label: "Saved", icon: "❤️" },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-teal-950/10 bg-white/95 px-3 pb-4 pt-2 shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-bold transition ${
                active
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-400 hover:text-teal-700"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}