import Link from "next/link";
import PredictorForm from "@/components/PredictorForm";

const quickActions = [
  { label: "All Colleges", href: "/colleges", icon: "🏛️", bg: "bg-teal-50" },
  { label: "Compare", href: "/compare", icon: "🔀", bg: "bg-orange-50" },
  { label: "AI Counselor", href: "/counselor", icon: "🤖", bg: "bg-blue-50" },
  { label: "Cutoff Trends", href: "/cutoff", icon: "📈", bg: "bg-purple-50" },
];

const cities = [
  { name: "Pune", img: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&auto=format&fit=crop" },
  { name: "Mumbai", img: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400&auto=format&fit=crop" },
  { name: "Nagpur", img: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=400&auto=format&fit=crop" },
  { name: "Nashik", img: "https://images.unsplash.com/photo-1627894483216-2138af692e32?w=400&auto=format&fit=crop" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white px-5 pb-8 pt-6">
      {/* Header */}
      {/* Sticky Home Header */}
<header className="sticky top-0 z-50 -mx-5 bg-white px-5 pb-4 pt-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="text-4xl">🎓</div>

      <h1 className="text-[30px] font-black tracking-tight text-slate-950">
        Admission<span className="text-teal-600">OS</span>
      </h1>
    </div>

    <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-3xl text-slate-900">
      ♡
    </button>
  </div>
</header>

      {/* Hero */}
      <section className="relative mb-5 min-h-[170px] overflow-hidden">
        <div className="relative z-10 max-w-[58%] pt-5">
          <h2 className="text-[27px] font-black leading-tight text-slate-950">
            Hi, Krishna! 👋
          </h2>
          <p className="mt-4 text-[18px] font-medium leading-8 text-slate-500">
            Find the best engineering colleges that match your profile.
          </p>
        </div>

        <div className="absolute -right-2 top-0 text-[130px] leading-none">
          🧑‍🎓
        </div>
      </section>

      {/* Predictor Card */}
      <section className="mb-8 overflow-hidden rounded-[24px] bg-gradient-to-br from-teal-600 to-teal-700 p-5 shadow-xl shadow-teal-900/20">
        <div className="relative">
          <div className="absolute -right-8 top-2 h-32 w-32 rounded-[2rem] bg-white/10" />
          <div className="absolute right-8 top-16 h-12 w-12 rounded-2xl bg-white/10" />

          <h2 className="relative text-[30px] font-black leading-tight text-white">
            Predict Your Colleges
          </h2>

          <p className="relative mt-4 text-[20px] font-medium leading-8 text-white/95">
            Get chance based college predictions in seconds.
          </p>

          <Link
            href="#predictor"
            className="relative mt-7 flex h-[64px] items-center justify-center rounded-2xl bg-white text-[21px] font-black text-teal-700 shadow-inner"
          >
            Start Predictor <span className="ml-4 text-3xl">→</span>
          </Link>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h3 className="mb-5 text-[25px] font-black text-slate-950">
          Quick Actions
        </h3>

        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((item) => (
            <Link key={item.label} href={item.href} className="text-center">
              <div
                className={`mx-auto mb-3 flex h-[72px] w-[72px] items-center justify-center rounded-[24px] ${item.bg} text-4xl`}
              >
                {item.icon}
              </div>
              <p className="text-[15px] font-bold leading-5 text-slate-900">
                {item.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Cities */}
      <section className="mb-8">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[25px] font-black text-slate-950">Top Cities</h3>
          <Link href="/colleges" className="text-[20px] font-black text-teal-600">
            View all
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {cities.map((city) => (
            <Link key={city.name} href={`/colleges?city=${city.name}`} className="text-center">
              <img
                src={city.img}
                alt={city.name}
                className="mb-3 h-[72px] w-full rounded-[22px] object-cover"
              />
              <p className="text-[18px] font-bold text-slate-900">{city.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Updates */}
      <section className="mb-8">
        <h3 className="mb-5 text-[25px] font-black text-slate-950">
          Latest Updates
        </h3>

        <div className="flex gap-4 rounded-[22px] bg-white p-4 shadow-lg shadow-slate-200/80 ring-1 ring-slate-100">
          <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-4xl">
            🏫
          </div>

          <div>
            <h4 className="text-[19px] font-black leading-snug text-slate-950">
              DSE CAP 2025 Schedule Released
            </h4>
            <p className="mt-2 text-[16px] font-medium leading-6 text-slate-500">
              Check important dates for registration, merit list and seat allotment.
            </p>
          </div>
        </div>
      </section>

      {/* Your Existing Predictor Form */}
      <section id="predictor" className="scroll-mt-6">
        <h3 className="mb-4 text-[25px] font-black text-slate-950">
          Start Prediction
        </h3>
        <PredictorForm />
      </section>
    </div>
  );
}