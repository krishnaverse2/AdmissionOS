"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const savedName =
      localStorage.getItem("admissionos_user_name") || "User";

    setUserName(savedName);
  }, []);

  const pageInfo = useMemo(() => {
    if (pathname.startsWith("/results")) {
      return {
        title: "Prediction Results",
        subtitle: "Explore colleges matching your profile.",
      };
    }

    if (pathname.startsWith("/preference-list")) {
      return {
        title: "Preference List",
        subtitle: "Your personalized CAP option form order.",
      };
    }

    if (pathname.startsWith("/compare")) {
      return {
        title: "Compare Colleges",
        subtitle: "Compare colleges and choose the better option.",
      };
    }

    if (pathname.startsWith("/colleges")) {
      return {
        title: "All Colleges",
        subtitle: "Explore engineering colleges across Maharashtra.",
      };
    }

    if (pathname.startsWith("/saved")) {
      return {
        title: "Saved Colleges",
        subtitle: "Your shortlisted colleges in one place.",
      };
    }

    if (pathname.startsWith("/counselor")) {
      return {
        title: "AI Counselor",
        subtitle: "Get personalized admission guidance.",
      };
    }

    if (pathname.startsWith("/cutoff")) {
      return {
        title: "Cutoff Trends",
        subtitle: "Explore previous admission cutoff trends.",
      };
    }

    if (pathname.startsWith("/college/")) {
      return {
        title: "College Details",
        subtitle: "Explore college information and admission insights.",
      };
    }

    return {
      title: "AdmissionOS",
      subtitle: "Find your best engineering college.",
    };
  }, [pathname]);

  // Home page already has its own exact header.
  if (pathname === "/") {
    return null;
  }

  // Signup should stay clean.
  if (pathname.startsWith("/signup")) {
    return null;
  }

  const firstLetter =
    userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[430px] px-5 pb-4 pt-4">
          <div className="flex items-center justify-between">
            {/* LEFT SIDE */}
            <div className="flex min-w-0 items-center gap-3">
              {/* BACK BUTTON */}
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-50 text-[22px] font-black text-slate-900 transition duration-200 active:scale-90"
              >
                ←
              </button>

              {/* LOGO + NAME */}
              <Link
                href="/"
                className="flex min-w-0 items-center gap-2.5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-teal-50 text-[25px]">
                  🎓
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-[20px] font-black tracking-tight text-slate-950">
                    Admission
                    <span className="text-teal-600">OS</span>
                  </h1>

                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Maharashtra DSE
                  </p>
                </div>
              </Link>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-[20px] transition duration-200 active:scale-90"
              >
                🔔

                <span className="absolute right-[8px] top-[7px] h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
              </button>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-[16px] font-black text-white shadow-lg shadow-teal-600/20">
                {firstLetter}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PAGE TITLE AREA */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto w-full max-w-[430px] px-5 pb-5 pt-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-10 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />

            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600">
                AdmissionOS
              </p>

              <h2 className="mt-1 text-[25px] font-black leading-tight tracking-tight text-slate-950">
                {pageInfo.title}
              </h2>

              <p className="mt-1.5 text-[13px] font-medium leading-5 text-slate-500">
                {pageInfo.subtitle}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}