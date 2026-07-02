import type { ChanceLevel } from "@/lib/types";

const CONFIG: Record<
  ChanceLevel,
  { label: string; classes: string; dot: string }
> = {
  High: {
    label: "High Chance",
    classes: "bg-green-50 text-green-700 ring-green-200",
    dot: "bg-green-500",
  },
  Medium: {
    label: "Medium Chance",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  Low: {
    label: "Low Chance",
    classes: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
};

export default function ChanceBadge({ chance }: { chance: ChanceLevel }) {
  const c = CONFIG[chance];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ring-1 ${c.classes}`}
    >
      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}