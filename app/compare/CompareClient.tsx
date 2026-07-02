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
    <div className="min-h-screen bg-white px-5 pb-8 pt-5">
      {/* Native App Header */}
      <header className="sticky top-0 z-40 -mx-5 bg-white px-5 pb-4 pt-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[0.2em] text-teal-600">
              Side by side
            </p>
            <h1 className="mt-1 text-[30px] font-black tracking-tight text-slate-950">
              Compare
            </h1>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-3xl">
            📊
          </div>
        </div>
      </header>

      <section className="pt-6">
        <h2 className="text-[25px] font-black text-slate-950">
          Compare colleges
        </h2>
        <p className="mt-2 text-[16px] font-medium leading-7 text-slate-500">
          Pick 2 or 3 colleges to compare cutoffs, placements, and fees.
        </p>
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        {collegesData.map((c) => {
          const active = selectedIds.includes(c.id);

          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                active
                  ? "border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-600/20"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm"
              }`}
            >
              {c.shortName}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">
          {error}
        </p>
      )}

      {selectedIds.length < 2 && (
        <div className="mt-8 rounded-[24px] bg-slate-50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm">
            📊
          </div>
          <p className="text-[16px] font-bold text-slate-600">
            Select at least 2 colleges above to see a comparison.
          </p>
        </div>
      )}

      {rows && rows.length > 0 && selectedIds.length >= 2 && (
        <>
          <div className="mt-6 overflow-x-auto rounded-[24px] border border-slate-100 bg-white shadow-lg shadow-slate-200/80">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-4">College</th>
                  {rows.map((r) => (
                    <th
                      key={r.collegeId}
                      className="px-4 py-4 text-slate-950"
                    >
                      {r.shortName}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <CompareRow label="City" cells={rows.map((r) => r.cityName)} />
                <CompareRow label="Type" cells={rows.map((r) => r.collegeType)} />
                <CompareRow
                  label="Hostel"
                  cells={rows.map((r) =>
                    r.hostelAvailable ? "Available" : "Not available"
                  )}
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
                  cells={rows.map((r) =>
                    `₹${r.totalFee.toLocaleString("en-IN")}`
                  )}
                />

                <tr>
                  <td className="px-4 py-4 align-top font-bold text-slate-600">
                    Branches & cutoffs
                  </td>

                  {rows.map((r) => (
                    <td key={r.collegeId} className="px-4 py-4 align-top">
                      <ul className="space-y-2">
                        {r.branches.map((b) => (
                          <li key={b.branchId} className="text-xs">
                            <span className="font-semibold text-slate-500">
                              {b.branchName}:{" "}
                            </span>
                            <span className="font-black text-slate-900">
                              {b.cutoff ? `${b.cutoff}%` : "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-[24px] bg-teal-50 p-5 ring-1 ring-teal-100">
            <p className="text-[15px] font-black text-teal-700">
              AI recommendation
            </p>
            <p className="mt-2 text-[15px] font-medium leading-7 text-slate-700">
              {recommendation}
            </p>
          </div>
        </>
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-slate-400">
        This prediction is based on previous cutoff data and available college
        information. Final admission depends on official CAP rounds, seat
        availability, category reservation rules, and DTE/CET Cell updates.
      </p>
    </div>
  );
}

function CompareRow({ label, cells }: { label: string; cells: string[] }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-4 font-bold text-slate-600">{label}</td>
      {cells.map((c, i) => (
        <td key={i} className="px-4 py-4 font-black text-slate-900">
          {c}
        </td>
      ))}
    </tr>
  );
}