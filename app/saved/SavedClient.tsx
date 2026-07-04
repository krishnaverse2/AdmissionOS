"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSearchHistory } from "@/lib/clientStore";
import Loader from "@/components/Loader";

interface SavedItem {
  collegeId: string;
  branchId: string;
  collegeName: string;
  branchName: string;
  averagePackage: number | null;
  savedAt: string;
}

type SearchHistory = ReturnType<typeof getSearchHistory>;

export default function SavedClient() {
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState<SavedItem[] | null>(null);
  const [history, setHistory] = useState<SearchHistory>([]);

  useEffect(() => {
    setMounted(true);
    setHistory(getSearchHistory());

    fetch("/api/saved-colleges")
      .then((res) => res.json())
      .then((data) => setSaved(data.saved ?? []))
      .catch(() => setSaved([]));
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white px-5 pb-8 pt-5">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-5 pb-8 pt-5">
      <section className="pt-6">
        <h2 className="text-[24px] font-black text-slate-950">Saved colleges</h2>

        {saved === null && <Loader />}

        {saved !== null && saved.length === 0 && (
          <div className="mt-4 rounded-[24px] bg-slate-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm">
              ❤️
            </div>
            <p className="text-[16px] font-bold leading-7 text-slate-600">
              Nothing saved yet. Use the “Save college” button on any result card.
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4">
          {saved?.map((s) => (
            <Link
              key={`${s.collegeId}-${s.branchId}`}
              href={`/college/${s.collegeId}`}
              className="rounded-[24px] bg-white p-5 shadow-lg shadow-slate-200/80 ring-1 ring-slate-100"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-3xl">
                  🏛️
                </div>

                <div className="flex-1">
                  <p className="text-[18px] font-black leading-snug text-slate-950">
                    {s.collegeName}
                  </p>

                  <p className="mt-1 text-[15px] font-bold text-slate-500">
                    {s.branchName}
                  </p>

                  {s.averagePackage !== null && (
                    <p className="mt-2 inline-flex rounded-full bg-teal-50 px-3 py-1 text-[12px] font-black text-teal-700">
                      Avg. package ₹{s.averagePackage} LPA
                    </p>
                  )}
                </div>

                <span className="text-2xl text-slate-300">›</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <h2 className="text-[24px] font-black text-slate-950">
          Recent searches
        </h2>

        {history.length === 0 && (
          <div className="mt-4 rounded-[24px] bg-slate-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm">
              🔍
            </div>
            <p className="text-[16px] font-bold leading-7 text-slate-600">
              Your search history will show up here after you run the predictor.
            </p>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {history.map((h, i) => (
            <div
              key={i}
              className="rounded-[22px] bg-white p-4 shadow-md shadow-slate-200/70 ring-1 ring-slate-100"
            >
              <p className="text-[15px] font-black text-slate-800">
                {h.percentage}% · {h.category}
              </p>

              <p className="mt-1 text-[14px] font-bold text-slate-500">
                {h.branch === "any" ? "Any branch" : h.branch} ·{" "}
                {h.city === "any" ? "Any city" : h.city}
              </p>

              <p className="mt-2 text-[12px] font-medium text-slate-400">
                {new Date(h.searchedAt).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}