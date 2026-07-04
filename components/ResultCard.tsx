"use client";

import Link from "next/link";
import { useState } from "react";
import type { PredictionResult } from "@/lib/types";
import ChanceBadge from "@/components/ChanceBadge";

interface Props {
  result: PredictionResult;
  selected?: boolean;
  onToggleCompare?: (checked: boolean) => void;
  compareDisabled?: boolean;
}

export default function ResultCard({
  result,
  selected,
  onToggleCompare,
  compareDisabled,
}: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/save-college", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collegeId: result.collegeId,
          branchId: result.branchId,
          action: saved ? "unsave" : "save",
        }),
      });
      setSaved(!saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-[2rem] bg-white p-4 shadow-xl shadow-teal-950/8 ring-1 ring-slate-200/70">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
          #{result.qualityRank} Rank
        </div>

        <div className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-black text-teal-700">
          Score {result.qualityScore}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-2xl">
            🏛️
          </div>

          <div>
            <h3 className="break-words text-base font-black leading-tight text-slate-950">
              {result.collegeName}
            </h3>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              📍 {result.cityName} · {result.collegeType}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg transition active:scale-95 ${
            saved ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400"
          }`}
        >
          {saved ? "❤️" : "♡"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ChanceBadge chance={result.chance} />

        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
          💻 {result.branchName}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Last Cutoff" value={`${result.previousCutoff}%`} />
        <Stat
          label="Expected"
          value={`${result.expectedCutoff.min}% - ${result.expectedCutoff.max}%`}
        />
        <Stat
          label="Avg Package"
          value={result.averagePackage ? `${result.averagePackage} LPA` : "N/A"}
        />
        <Stat
          label="Fees"
          value={
            result.totalFee
              ? `₹${result.totalFee.toLocaleString("en-IN")}`
              : "N/A"
          }
        />
      </div>

      <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        {result.recommendation}
      </p>

      <div className="mt-4 flex items-center gap-2">
        {onToggleCompare && (
          <label
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-black ${
              selected
                ? "border-teal-600 bg-teal-50 text-teal-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <input
              type="checkbox"
              checked={selected}
              disabled={compareDisabled}
              onChange={(e) => onToggleCompare(e.target.checked)}
              className="accent-teal-600"
            />
            Compare
          </label>
        )}

        <Link
          href={`/college/${result.collegeId}`}
          className="flex flex-1 items-center justify-center rounded-2xl bg-slate-950 px-3 py-3 text-sm font-black text-white active:scale-[0.98]"
        >
          Details →
        </Link>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}