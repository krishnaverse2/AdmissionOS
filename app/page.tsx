"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PredictorForm from "@/components/PredictorForm";
import Loader from "@/components/Loader";

const quickActions = [
  {
    label: "Home",
    href: "/",
    icon: "🏠",
    bg: "from-teal-100 to-emerald-50",
  },
  {
    label: "Compare",
    href: "/compare",
    icon: "🔀",
    bg: "from-orange-100 to-amber-50",
  },
  {
    label: "AI Counselor",
    href: "/counselor",
    icon: "🤖",
    bg: "from-blue-100 to-sky-50",
  },
  {
    label: "Saved",
    href: "/saved",
    icon: "❤️",
    bg: "from-rose-100 to-pink-50",
  },
];

const cities = [
  {
    name: "Pune",
    slug: "pune",
    emoji: "🌆",
    bg: "from-orange-100 to-amber-50",
  },
  {
    name: "Mumbai",
    slug: "mumbai",
    emoji: "🌊",
    bg: "from-blue-100 to-cyan-50",
  },
  {
    name: "Nagpur",
    slug: "nagpur",
    emoji: "🍊",
    bg: "from-orange-100 to-yellow-50",
  },
  {
    name: "Nashik",
    slug: "nashik",
    emoji: "⛰️",
    bg: "from-emerald-100 to-teal-50",
  },
];

export default function Home() {
  const router = useRouter();
  const scrollAreaRef = useRef<HTMLElement | null>(null);
  const predictorRef = useRef<HTMLElement | null>(null);

  const [userName, setUserName] = useState("");
  const [selectedCity, setSelectedCity] = useState("any");

  useEffect(() => {
    const savedName = localStorage.getItem("admissionos_user_name");

    if (!savedName) {
      router.push("/signup");
      return;
    }

    setUserName(savedName);
  }, [router]);

  function scrollToPredictor() {
    const scrollArea = scrollAreaRef.current;
    const predictor = predictorRef.current;

    if (!scrollArea || !predictor) return;

    const top =
      predictor.offsetTop -
      scrollArea.offsetTop -
      16;

    scrollArea.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
  }

  function handleCityClick(citySlug: string) {
    setSelectedCity(citySlug);

    setTimeout(() => {
      const scrollArea = scrollAreaRef.current;
      const predictor = predictorRef.current;

      if (!scrollArea || !predictor) return;

      const top =
        predictor.offsetTop -
        scrollArea.offsetTop -
        16;

      scrollArea.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
    }, 100);
  }

  function handleLogout() {
    localStorage.removeItem("admissionos_user_name");
    router.push("/signup");
  }

  if (!userName) {
    return (
      <div className="flex h-screen items-center justify-center overflow-hidden bg-[#F7FBFA]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#F7FBFA]">
      {/* =====================================================
          FIXED HEADER
      ===================================================== */}
      <header className="fixed left-0 right-0 top-0 z-[100] border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] w-full max-w-[430px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-teal-500 to-emerald-600 text-2xl shadow-lg shadow-teal-900/20">
              🎓
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-teal-600">
                Maharashtra DSE
              </p>

              <h1 className="text-[24px] font-black leading-none tracking-tight text-slate-950">
                Admission
                <span className="text-teal-600">OS</span>
              </h1>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-xl shadow-sm ring-1 ring-slate-200 transition active:scale-90"
            aria-label="Logout"
            title="Logout"
          >
            👤
          </button>
        </div>
      </header>

      {/* =====================================================
          FIXED WELCOME AREA
      ===================================================== */}
      <div className="fixed left-0 right-0 top-[76px] z-[90] bg-[#F7FBFA] px-5 pb-4 pt-5">
        <div className="mx-auto w-full max-w-[430px]">
          <section className="home-fade-up relative min-h-[190px] overflow-hidden rounded-[32px] bg-white p-5 shadow-xl shadow-teal-950/[0.08] ring-1 ring-slate-100">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-teal-100/80 blur-2xl" />

            <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-emerald-100/60 blur-2xl" />

            <div className="relative z-10 max-w-[64%]">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />

                <p className="text-xs font-black text-teal-700">
                  Welcome back
                </p>
              </div>

              <h2 className="mt-3 text-[27px] font-black leading-[1.08] text-slate-950">
                Hi, {userName}! 👋
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                Find the best engineering college for your profile.
              </p>
            </div>

            <div className="student-float absolute -right-3 bottom-2 text-[118px] leading-none">
              🧑‍🎓
            </div>
          </section>
        </div>
      </div>

      {/* =====================================================
          ONLY THIS AREA SCROLLS
          76px header
          + 5px top gap
          + 190px welcome card
          + 16px bottom padding
          = starts around 286px
      ===================================================== */}
      <main
        ref={scrollAreaRef}
        className="fixed bottom-0 left-1/2 top-[286px] w-full max-w-[430px] -translate-x-1/2 overflow-y-auto overscroll-contain px-5 pb-28 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* =====================================================
            PREDICTOR HERO
        ===================================================== */}
        <section className="home-fade-up home-delay-1 relative mb-8 overflow-hidden rounded-[30px] bg-gradient-to-br from-teal-600 via-teal-600 to-emerald-500 p-5 shadow-2xl shadow-teal-900/25">
          <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />

          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-emerald-300/20" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="max-w-[72%]">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-teal-100">
                Smart Predictor
              </p>

              <h2 className="mt-3 text-[29px] font-black leading-[1.08] text-white">
                Predict Your Colleges
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-white/90">
                Get ranked college matches based on your DSE profile.
              </p>
            </div>

            <div className="target-pulse flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-white/20 text-4xl backdrop-blur-md">
              🎯
            </div>
          </div>

          <button
            type="button"
            onClick={scrollToPredictor}
            className="relative z-10 mt-7 flex h-[60px] w-full items-center justify-center rounded-2xl bg-white text-[17px] font-black text-teal-700 shadow-xl shadow-teal-950/20 transition active:scale-[0.98]"
          >
            Start Predictor

            <span className="arrow-move ml-3 text-2xl">
              →
            </span>
          </button>
        </section>

        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}
        <section className="home-fade-up home-delay-2 mb-8">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-[23px] font-black tracking-tight text-slate-950">
              Quick Actions
            </h3>

            <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[11px] font-black text-teal-700">
              Main Tabs
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className="action-card group text-center"
                style={{
                  animationDelay: `${index * 90}ms`,
                }}
              >
                <div
                  className={`mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-[23px] bg-gradient-to-br ${item.bg} text-[30px] shadow-lg shadow-slate-200/80 ring-1 ring-white transition duration-300 group-hover:-translate-y-1 group-active:scale-90`}
                >
                  {item.icon}
                </div>

                <p className="mt-3 text-[12px] font-black leading-4 text-slate-800">
                  {item.label}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* =====================================================
            TOP CITIES
        ===================================================== */}
        <section className="home-fade-up home-delay-3 mb-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-[23px] font-black tracking-tight text-slate-950">
                Top Cities
              </h3>

              <p className="mt-1 text-xs font-semibold text-slate-400">
                Tap city to start prediction
              </p>
            </div>

            <button
              type="button"
              onClick={scrollToPredictor}
              className="text-sm font-black text-teal-600 transition active:scale-95"
            >
              Predict
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {cities.map((city, index) => {
              const active = selectedCity === city.slug;

              return (
                <button
                  type="button"
                  key={city.name}
                  onClick={() => handleCityClick(city.slug)}
                  className="city-card group text-center"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div
                    className={`mx-auto flex h-[68px] w-full items-center justify-center rounded-[23px] bg-gradient-to-br text-[34px] shadow-lg transition duration-300 group-active:scale-90 ${
                      active
                        ? "from-teal-500 to-emerald-500 shadow-teal-900/20 ring-2 ring-teal-300"
                        : `${city.bg} shadow-slate-200/80 ring-1 ring-white`
                    }`}
                  >
                    {city.emoji}
                  </div>

                  <p
                    className={`mt-3 text-[13px] font-black ${
                      active
                        ? "text-teal-700"
                        : "text-slate-900"
                    }`}
                  >
                    {city.name}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            LATEST UPDATE
        ===================================================== */}
        <section className="home-fade-up home-delay-4 mb-8">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-[23px] font-black tracking-tight text-slate-950">
              Latest Updates
            </h3>

            <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-red-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              New
            </span>
          </div>

          <div className="update-card relative overflow-hidden rounded-[26px] bg-white p-4 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-teal-100/80 blur-2xl" />

            <div className="relative flex gap-4">
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-slate-100 to-teal-50 text-4xl">
                🏫
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-[17px] font-black leading-snug text-slate-950">
                  DSE CAP 2025 Schedule Released
                </h4>

                <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-500">
                  Check registration, merit list and seat allotment dates.
                </p>

                <button
                  type="button"
                  onClick={scrollToPredictor}
                  className="mt-3 text-xs font-black text-teal-600"
                >
                  Start prediction →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            PREDICTION FORM
        ===================================================== */}
        <section
          ref={predictorRef}
          id="predictor"
          className="home-fade-up home-delay-5"
        >
          <div className="mb-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-600">
                  Admission Predictor
                </p>

                <h3 className="mt-1 text-[24px] font-black tracking-tight text-slate-950">
                  Start Prediction
                </h3>
              </div>

              {selectedCity !== "any" && (
                <div className="rounded-full bg-teal-50 px-3 py-2 text-xs font-black capitalize text-teal-700 ring-1 ring-teal-100">
                  📍 {selectedCity.replaceAll("-", " ")}
                </div>
              )}
            </div>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Enter your DSE details to get matching colleges.
            </p>
          </div>

          <PredictorForm
            key={selectedCity}
            initialCity={selectedCity}
          />
        </section>
      </main>

      {/* =====================================================
          ANIMATIONS
      ===================================================== */}
      <style jsx global>{`
        html,
        body {
          height: 100%;
          overflow: hidden;
          overscroll-behavior: none;
        }

        @keyframes homeFadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes studentFloat {
          0%,
          100% {
            transform: translateY(0) rotate(-2deg);
          }

          50% {
            transform: translateY(-9px) rotate(2deg);
          }
        }

        @keyframes targetPulse {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.08);
          }
        }

        @keyframes arrowMove {
          0%,
          100% {
            transform: translateX(0);
          }

          50% {
            transform: translateX(6px);
          }
        }

        @keyframes actionAppear {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.94);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .home-fade-up {
          opacity: 0;
          animation: homeFadeUp 0.65s ease-out forwards;
        }

        .home-delay-1 {
          animation-delay: 0.08s;
        }

        .home-delay-2 {
          animation-delay: 0.16s;
        }

        .home-delay-3 {
          animation-delay: 0.24s;
        }

        .home-delay-4 {
          animation-delay: 0.32s;
        }

        .home-delay-5 {
          animation-delay: 0.4s;
        }

        .student-float {
          animation: studentFloat 3s ease-in-out infinite;
        }

        .target-pulse {
          animation: targetPulse 2.2s ease-in-out infinite;
        }

        .arrow-move {
          display: inline-block;
          animation: arrowMove 1.4s ease-in-out infinite;
        }

        .action-card,
        .city-card {
          opacity: 0;
          animation: actionAppear 0.55s ease-out forwards;
        }

        .update-card {
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .update-card:active {
          transform: scale(0.985);
        }

        @media (prefers-reduced-motion: reduce) {
          .home-fade-up,
          .student-float,
          .target-pulse,
          .arrow-move,
          .action-card,
          .city-card {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}