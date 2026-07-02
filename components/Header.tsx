"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  // Hide header on Home page
  if (pathname === "/") {
    return null;
  }

  function pageTitle() {
    if (pathname.startsWith("/results")) return "Prediction Results";
    if (pathname.startsWith("/preference-list")) return "Preference List";
    if (pathname.startsWith("/compare")) return "Compare Colleges";
    if (pathname.startsWith("/colleges")) return "College Explorer";
    if (pathname.startsWith("/saved")) return "Saved Colleges";
    if (pathname.startsWith("/counselor")) return "AI Counselor";
    return "AdmissionOS";
  }

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500 px-5 pb-6 pt-10 shadow-xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-teal-700 shadow-lg">
              AO
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-100">
                Maharashtra DSE
              </p>
              <h1 className="text-xl font-black text-white">AdmissionOS</h1>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-lg text-white backdrop-blur-md">
              🔔
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-black text-teal-700 shadow-lg">
              K
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[1.7rem] bg-white/15 p-4 backdrop-blur-md">
          <p className="text-sm text-teal-100">Welcome back 👋</p>

          <h2 className="mt-1 text-2xl font-black text-white">
            {pageTitle()}
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-teal-50">
            Find your best college using official Maharashtra DSE cutoff data.
          </p>
        </div>
      </div>
    </header>
  );
}