"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import collegesData from "@/lib/data/colleges.json";

interface ComparisonRow {
  collegeId: string;
  collegeName: string;
  shortName: string;
  cityName: string;
  collegeType: string;
  hostelAvailable: boolean;
  branches: {
    branchId: string;
    branchName: string;
    cutoff: number | null;
    placementPercentage: number | null;
    averagePackage: number | null;
    highestPackage: number | null;
  }[];
  tuitionFee: number;
  hostelFee: number;
  totalFee: number;
  bestAveragePackage: number;
  bestHighestPackage: number;
}

export default function CompareClient() {
  const params = useSearchParams();
  const [rows, setRows] = useState<ComparisonRow[] | null>(null);
  const [recommendation, setRecommendation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const idsParam = params.get("ids");
    return idsParam ? idsParam.split(",").filter(Boolean) : [];
  });

  const category = params.get("category") ?? "OPEN";

  useEffect(() => {
    if (selectedIds.length < 2) {
      return;
    }
    fetch("/api/compare-colleges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collegeIds: selectedIds, category }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setRows(data.rows);
          setRecommendation(data.recommendation);
        }
      })
      .catch(() => setError("Couldn't compare these colleges."));
  }, [selectedIds, category]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev;
      const url = new URL(window.location.href);
      url.searchParams.set("ids", next.join(","));
      window.history.replaceState(null, "", url.toString());
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="font-mono-figures text-xs font-semibold uppercase tracking-widest text-indigo">
        Side by side
      </p>
      <h1 className="font-display text-2xl font-bold text-ink">
        Compare colleges
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Pick 2 or 3 colleges to compare cutoffs, placements, and fees.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {collegesData.map((c) => {
          const active = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "border-indigo bg-indigo text-paper"
                  : "border-line text-ink/70 hover:border-indigo/50"
              }`}
            >
              {c.shortName}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-6 text-chance-low">{error}</p>}

      {selectedIds.length < 2 && (
        <p className="mt-8 text-sm text-ink/55">
          Select at least 2 colleges above to see a comparison.
        </p>
      )}

      {rows && rows.length > 0 && selectedIds.length >= 2 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-dim text-xs uppercase tracking-wide text-ink/50">
                  <th className="px-4 py-3">College</th>
                  {rows.map((r) => (
                    <th key={r.collegeId} className="px-4 py-3 font-display text-ink">
                      {r.shortName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono-figures">
                <CompareRow
                  label="City"
                  cells={rows.map((r) => r.cityName)}
                  mono={false}
                />
                <CompareRow
                  label="Type"
                  cells={rows.map((r) => r.collegeType)}
                  mono={false}
                />
                <CompareRow
                  label="Hostel"
                  cells={rows.map((r) => (r.hostelAvailable ? "Available" : "Not available"))}
                  mono={false}
                />
                <CompareRow
                  label="Best avg. package"
                  cells={rows.map((r) => `₹${r.bestAveragePackage} LPA`)}
                />
                <CompareRow
                  label="Best highest package"
                  cells={rows.map((r) => `₹${r.bestHighestPackage} LPA`)}
                />
                <CompareRow
                  label="Total fee / year"
                  cells={rows.map((r) => `₹${r.totalFee.toLocaleString("en-IN")}`)}
                />
                <tr>
                  <td className="px-4 py-3 align-top font-sans font-medium text-ink/70">
                    Branches & cutoffs
                  </td>
                  {rows.map((r) => (
                    <td key={r.collegeId} className="px-4 py-3 align-top">
                      <ul className="space-y-1">
                        {r.branches.map((b) => (
                          <li key={b.branchId} className="text-xs">
                            <span className="font-sans text-ink/60">
                              {b.branchName}:{" "}
                            </span>
                            {b.cutoff ? `${b.cutoff}%` : "—"}
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-lg border border-indigo/30 bg-indigo/5 p-4">
            <p className="text-sm font-medium text-indigo">
              AI recommendation
            </p>
            <p className="mt-1 text-sm text-ink/75">{recommendation}</p>
          </div>
        </>
      )}

      <p className="mt-8 text-xs leading-relaxed text-ink/45">
        This prediction is based on previous cutoff data and available
        college information. Final admission depends on official CAP
        rounds, seat availability, category reservation rules, and
        DTE/CET Cell updates.
      </p>
    </div>
  );
}

function CompareRow({
  label,
  cells,
  mono = true,
}: {
  label: string;
  cells: string[];
  mono?: boolean;
}) {
  return (
    <tr className="border-b border-line/60">
      <td className="px-4 py-3 font-sans font-medium text-ink/70">{label}</td>
      {cells.map((c, i) => (
        <td key={i} className={mono ? "px-4 py-3" : "px-4 py-3 font-sans"}>
          {c}
        </td>
      ))}
    </tr>
  );
}
