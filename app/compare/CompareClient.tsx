"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import collegesData from "@/lib/data/colleges.json";
import Loader from "@/components/Loader";

interface CollegeItem {
  id: string;
  name: string;
  shortName: string;
  cityId: string;
  type: string;
}

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
  const category = params.get("category") ?? "GOPEN";

  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ComparisonRow[] | null>(null);
  const [recommendation, setRecommendation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const idsParam = params.get("ids");

    return idsParam
      ? idsParam.split(",").filter(Boolean).slice(0, 3)
      : [];
  });

  const colleges = collegesData as CollegeItem[];

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const filteredColleges = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return colleges.slice(0, 35);
    }

    return colleges
      .filter(
        (college) =>
          college.name.toLowerCase().includes(q) ||
          college.shortName.toLowerCase().includes(q) ||
          college.cityId.toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [query, colleges]);

  const selectedColleges = useMemo(() => {
    return selectedIds
      .map((id) => colleges.find((college) => college.id === id))
      .filter((college): college is CollegeItem => Boolean(college));
  }, [selectedIds, colleges]);

  useEffect(() => {
    if (!showComparison) {
      return;
    }

    if (selectedIds.length < 2) {
      setShowComparison(false);
      setRows(null);
      setRecommendation("");
      return;
    }

    let cancelled = false;

    async function loadComparison() {
      try {
        setLoading(true);
        setError(null);
        setRows(null);
        setRecommendation("");

        const response = await fetch("/api/compare-colleges", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collegeIds: selectedIds,
            category,
          }),
        });

        const data = await response.json();

        if (cancelled) return;

        if (!response.ok || data.error) {
          setError(data.error || "Couldn't compare these colleges.");
          setRows(null);
          return;
        }

        setRows(data.rows ?? []);
        setRecommendation(data.recommendation ?? "");
      } catch {
        if (cancelled) return;

        setError("Couldn't compare these colleges.");
        setRows(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadComparison();

    return () => {
      cancelled = true;
    };
  }, [showComparison, selectedIds, category]);

  function updateUrl(nextIds: string[]) {
    const url = new URL(window.location.href);

    if (nextIds.length > 0) {
      url.searchParams.set("ids", nextIds.join(","));
    } else {
      url.searchParams.delete("ids");
    }

    window.history.replaceState(null, "", url.toString());
  }

  function toggle(id: string) {
    let nextIds: string[] = [];

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        nextIds = prev.filter((collegeId) => collegeId !== id);
      } else {
        if (prev.length >= 3) {
          nextIds = prev;
          return prev;
        }

        nextIds = [...prev, id];
      }

      return nextIds;
    });

    setTimeout(() => {
      updateUrl(nextIds);
    }, 0);

    setRows(null);
    setRecommendation("");
    setError(null);
  }

  function clearAll() {
    setSelectedIds([]);
    setRows(null);
    setRecommendation("");
    setError(null);
    setShowComparison(false);
    updateUrl([]);
  }

  function handleCompare() {
    if (selectedIds.length < 2) {
      return;
    }

    setError(null);
    setRows(null);
    setRecommendation("");
    setShowComparison(true);
  }

  function handleChangeColleges() {
    setShowComparison(false);
    setRows(null);
    setRecommendation("");
    setError(null);
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7FBFA]">
        <Loader />
      </div>
    );
  }

  if (showComparison) {
    return (
      <div className="min-h-screen bg-[#F7FBFA] px-5 pb-28 pt-5">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-teal-600 via-teal-600 to-emerald-500 p-5 text-white shadow-2xl shadow-teal-900/25">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-emerald-300/20" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-teal-100">
                  Comparison Result
                </p>

                <h1 className="mt-2 text-[30px] font-black leading-tight">
                  {selectedIds.length} Colleges Compared
                </h1>

                <p className="mt-2 text-sm font-semibold leading-6 text-white/90">
                  Compare cutoffs, fees, placements, branches and facilities.
                </p>
              </div>

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-white/20 text-4xl backdrop-blur">
                📊
              </div>
            </div>

            <button
              type="button"
              onClick={handleChangeColleges}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-teal-700 shadow-lg transition active:scale-[0.98]"
            >
              ← Change Colleges
            </button>
          </div>
        </section>

        <section className="mt-5">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Comparing
          </p>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {selectedColleges.map((college, index) => (
              <div
                key={college.id}
                className="min-w-[150px] flex-1 rounded-[22px] bg-white p-3 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-xs font-black text-teal-700">
                    #{index + 1}
                  </div>

                  <p className="line-clamp-2 text-xs font-black leading-tight text-slate-900">
                    {college.shortName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {loading && (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader />
          </div>
        )}

        {error && (
          <section className="mt-5 rounded-[26px] bg-red-50 p-4 ring-1 ring-red-100">
            <p className="text-sm font-black text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={handleCompare}
              className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white"
            >
              Try Again
            </button>
          </section>
        )}

        {!loading && !error && rows && rows.length > 0 && (
          <>
            <section className="mt-6 space-y-4">
              <div>
                <h2 className="text-[22px] font-black text-slate-950">
                  Comparison Details
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Side-by-side performance overview
                </p>
              </div>

              {rows.map((row, index) => (
                <CollegeCompareCard
                  key={row.collegeId}
                  row={row}
                  rank={index + 1}
                />
              ))}
            </section>

            <section className="mt-6 rounded-[28px] bg-gradient-to-br from-teal-50 to-emerald-50 p-5 shadow-lg shadow-teal-900/5 ring-1 ring-teal-100">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                  🤖
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-teal-700">
                    AI Recommendation
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    {recommendation ||
                      "Compare cutoff, placement, fees and location before making your final preference."}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {!loading &&
          !error &&
          rows &&
          rows.length === 0 && (
            <section className="mt-6 rounded-[26px] bg-amber-50 p-5 text-center ring-1 ring-amber-100">
              <p className="text-sm font-black text-amber-700">
                No comparison data found.
              </p>
            </section>
          )}

        <p className="mt-8 text-center text-xs leading-relaxed text-slate-400">
          Comparison is based on available cutoff, fee and placement data.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FBFA] px-5 pb-40 pt-5">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-teal-600 via-teal-600 to-emerald-500 p-5 text-white shadow-2xl shadow-teal-900/25">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-emerald-300/20" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-teal-100">
              College Compare
            </p>

            <h1 className="mt-2 text-[30px] font-black leading-tight">
              Compare smarter
            </h1>

            <p className="mt-2 text-sm font-semibold leading-6 text-white/90">
              Select 2 or 3 colleges and compare them side by side.
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-white/20 text-4xl backdrop-blur">
            📊
          </div>
        </div>

        <div className="relative z-10 mt-5 grid grid-cols-3 gap-3">
          <MiniStat label="Selected" value={selectedIds.length} />
          <MiniStat label="Maximum" value="3" />
          <MiniStat label="Category" value={category} />
        </div>
      </section>

      <section className="mt-6 rounded-[28px] bg-white p-4 shadow-xl shadow-slate-200/70 ring-1 ring-slate-100">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
          <span className="text-xl">🔍</span>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search college name, short name, city..."
            className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-500"
            >
              ✕
            </button>
          )}
        </div>

        {selectedColleges.length > 0 && (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Selected Colleges
                </p>

                <p className="mt-1 text-[11px] font-bold text-slate-400">
                  {selectedIds.length}/3 selected
                </p>
              </div>

              <button
                type="button"
                onClick={clearAll}
                className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-500"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2">
              {selectedColleges.map((college, index) => (
                <div
                  key={college.id}
                  className="flex items-center gap-3 rounded-2xl bg-teal-50 p-3 ring-1 ring-teal-100"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-xs font-black text-white">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-black text-slate-900">
                      {college.name}
                    </p>

                    <p className="mt-0.5 text-[11px] font-bold text-teal-700">
                      {college.shortName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggle(college.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-slate-500 shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {selectedIds.length === 0 && (
        <section className="mt-5 rounded-[26px] bg-blue-50 p-4 ring-1 ring-blue-100">
          <p className="text-sm font-black text-blue-700">
            Select your first college
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-blue-700/80">
            Choose minimum 2 and maximum 3 colleges.
          </p>
        </section>
      )}

      {selectedIds.length === 1 && (
        <section className="mt-5 rounded-[26px] bg-amber-50 p-4 ring-1 ring-amber-100">
          <p className="text-sm font-black text-amber-700">
            Select 1 more college
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-amber-700/80">
            You need at least 2 colleges to start comparison.
          </p>
        </section>
      )}

      {selectedIds.length >= 2 && (
        <section className="mt-5 rounded-[26px] bg-emerald-50 p-4 ring-1 ring-emerald-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
              ✓
            </div>

            <div>
              <p className="text-sm font-black text-emerald-700">
                Ready to compare
              </p>

              <p className="mt-1 text-xs font-semibold text-emerald-700/80">
                {selectedIds.length} colleges selected
              </p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <section className="mt-5 rounded-[26px] bg-red-50 p-4 ring-1 ring-red-100">
          <p className="text-sm font-black text-red-600">
            {error}
          </p>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-black text-slate-950">
              Choose Colleges
            </h2>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              Tap cards to select or remove
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
            {filteredColleges.length}
          </span>
        </div>

        <div className="space-y-3">
          {filteredColleges.map((college) => {
            const active = selectedIds.includes(college.id);
            const disabled = !active && selectedIds.length >= 3;

            return (
              <button
                key={college.id}
                type="button"
                onClick={() => toggle(college.id)}
                disabled={disabled}
                className={`w-full rounded-[24px] p-4 text-left shadow-lg ring-1 transition-all duration-200 active:scale-[0.99] ${
                  active
                    ? "bg-teal-600 text-white shadow-teal-900/20 ring-teal-500"
                    : disabled
                      ? "cursor-not-allowed bg-slate-50 text-slate-400 opacity-60 ring-slate-100"
                      : "bg-white text-slate-950 shadow-slate-200/70 ring-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                      active ? "bg-white/20" : "bg-teal-50"
                    }`}
                  >
                    🏛️
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-black leading-tight">
                      {college.name}
                    </h3>

                    <p
                      className={`mt-1 text-xs font-bold ${
                        active ? "text-white/80" : "text-slate-400"
                      }`}
                    >
                      {college.shortName} · {college.type}
                    </p>
                  </div>

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                      active
                        ? "bg-white text-teal-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {active ? "✓" : "+"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="fixed bottom-[82px] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-5">
        <button
          type="button"
          onClick={handleCompare}
          disabled={selectedIds.length < 2 || loading}
          className={`flex h-[62px] w-full items-center justify-center gap-3 rounded-[22px] text-base font-black shadow-2xl transition-all active:scale-[0.98] ${
            selectedIds.length >= 2
              ? "bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-teal-900/30"
              : "cursor-not-allowed bg-slate-200 text-slate-400 shadow-slate-200/50"
          }`}
        >
          <span className="text-xl">📊</span>

          {selectedIds.length < 2
            ? "Select at least 2 colleges"
            : `Compare ${selectedIds.length} Colleges`}

          {selectedIds.length >= 2 && (
            <span className="text-xl">→</span>
          )}
        </button>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
      <p className="text-base font-black text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-teal-100">
        {label}
      </p>
    </div>
  );
}

function CollegeCompareCard({
  row,
  rank,
}: {
  row: ComparisonRow;
  rank: number;
}) {
  return (
    <article className="rounded-[28px] bg-white p-4 shadow-xl shadow-slate-200/80 ring-1 ring-slate-100">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-xl font-black text-teal-700">
          #{rank}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black leading-tight text-slate-950">
            {row.collegeName}
          </h3>

          <p className="mt-1 text-xs font-bold text-slate-400">
            {row.cityName} · {row.collegeType}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Info
          label="Avg Package"
          value={
            row.bestAveragePackage
              ? `₹${row.bestAveragePackage} LPA`
              : "N/A"
          }
        />

        <Info
          label="Highest"
          value={
            row.bestHighestPackage
              ? `₹${row.bestHighestPackage} LPA`
              : "N/A"
          }
        />

        <Info
          label="Fees / Year"
          value={
            row.totalFee
              ? `₹${row.totalFee.toLocaleString("en-IN")}`
              : "N/A"
          }
        />

        <Info
          label="Hostel"
          value={row.hostelAvailable ? "Available" : "No"}
        />
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">
          Branches & Cutoffs
        </p>

        <div className="space-y-2">
          {row.branches.slice(0, 6).map((branch) => (
            <div
              key={branch.branchId}
              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2"
            >
              <span className="line-clamp-1 text-xs font-bold text-slate-600">
                {branch.branchName}
              </span>

              <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-black text-teal-700">
                {branch.cutoff !== null
                  ? `${branch.cutoff}%`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}