import Link from "next/link";
import PredictorForm from "@/components/PredictorForm";

const stats = [
  { label: "Colleges", value: "345+" },
  { label: "Branches", value: "84" },
  { label: "Cutoffs", value: "14K+" },
];

const actions = [
  { title: "All Colleges", desc: "Explore Maharashtra DSE colleges", href: "/colleges", icon: "🏛️" },
  { title: "Compare", desc: "Compare colleges side by side", href: "/compare", icon: "📊" },
  { title: "AI Counselor", desc: "Ask admission doubts", href: "/counselor", icon: "🤖" },
];

export default function Home() {
  return (
    <div className="space-y-6 px-4 py-5">
      <section className="-mt-10 rounded-[2rem] bg-white p-5 shadow-xl shadow-teal-950/10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-600">
          Smart CAP Assistant
        </p>
        <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950">
          Predict your best DSE colleges
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Get Dream, Target and Safe colleges using official Maharashtra cutoff data.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl bg-teal-50 p-3 text-center">
              <p className="text-lg font-black text-teal-700">{s.value}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 px-1 text-sm font-bold text-slate-800">
          Quick Actions
        </h3>
        <div className="grid gap-3">
          {actions.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="flex items-center gap-4 rounded-[1.7rem] bg-white p-4 shadow-sm shadow-teal-950/5 ring-1 ring-slate-200/70"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-2xl">
                {a.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-950">{a.title}</p>
                <p className="text-xs text-slate-500">{a.desc}</p>
              </div>
              <span className="text-slate-300">›</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 px-1 text-sm font-bold text-slate-800">
          Start Prediction
        </h3>
        <PredictorForm />
      </section>

      <p className="px-2 text-center text-[11px] leading-relaxed text-slate-400">
        Prediction is based on previous official cutoff records. Final admission
        depends on CAP rounds, seat availability and CET Cell rules.
      </p>
    </div>
  );
}