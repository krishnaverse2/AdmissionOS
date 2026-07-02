"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  Bot,
  Heart,
} from "lucide-react";

const tabs = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/compare",
    label: "Compare",
    icon: BarChart3,
  },
  {
    href: "/counselor",
    label: "AI",
    icon: Bot,
  },
  {
    href: "/saved",
    label: "Saved",
    icon: Heart,
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-gray-200 bg-white shadow-[0_-6px_20px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-4 py-2">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/" && pathname.startsWith(tab.href));

          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center py-1"
            >
              <Icon
                size={28}
                strokeWidth={2.3}
                className={`transition-all duration-200 ${
                  active
                    ? "text-teal-600 scale-110"
                    : "text-gray-400"
                }`}
              />

              <span
                className={`mt-1 text-[13px] transition-all ${
                  active
                    ? "font-bold text-teal-600"
                    : "font-medium text-gray-500"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}