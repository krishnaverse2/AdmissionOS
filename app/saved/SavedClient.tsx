"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSearchHistory } from "@/lib/clientStore";

interface SavedItem {
  collegeId: string;
  branchId: string;
  collegeName: string;
  branchName: string;
  averagePackage: number | null;
  savedAt: string;
}

export default function SavedClient() {
  const [saved, setSaved] = useState<SavedItem[] | null>(null);
  const [history] = useState<ReturnType<typeof getSearchHistory>>(() =>
    typeof window !== "undefined" ? getSearchHistory() : []
  );

  useEffect(() => {
    fetch("/api/saved-colleges")
      .then((res) => res.json())
      .then((data) => setSaved(data.saved ?? []))
      .catch(() => setSaved([]));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="font-mono-figures text-xs font-semibold uppercase tracking-widest text-indigo">
        Your dashboard
      </p>
      <h1 className="font-display text-2xl font-bold text-ink">
        Saved colleges & recent searches
      </h1>

      <section className="mt-6">
        <h2 className="font-display text-lg font-bold text-ink">
          Saved colleges
        </h2>
        {saved === null && (
          <p className="mt-2 text-sm text-ink/55">Loading…</p>
        )}
        {saved !== null && saved.length === 0 && (
          <p className="mt-2 text-sm text-ink/55">
            Nothing saved yet. Use the &ldquo;Save college&rdquo; button on
            any result card to keep track of options here.
          </p>
        )}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {saved?.map((s) => (
            <Link
              key={`${s.collegeId}-${s.branchId}`}
              href={`/college/${s.collegeId}`}
              className="rounded-lg border border-line bg-white p-4 transition-shadow hover:shadow-md"
            >
              <p className="font-display font-semibold text-ink">
                {s.collegeName}
              </p>
              <p className="text-sm text-ink/60">{s.branchName}</p>
              {s.averagePackage !== null && (
                <p className="mt-1 font-mono-figures text-xs text-ink/45">
                  Avg. package ₹{s.averagePackage} LPA
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">
          Recent searches
        </h2>
        {history.length === 0 && (
          <p className="mt-2 text-sm text-ink/55">
            Your search history (stored on this device) will show up here
            after you run the predictor.
          </p>
        )}
        <div className="mt-3 space-y-2">
          {history.map((h, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white px-4 py-3"
            >
              <p className="text-sm text-ink/75">
                {h.percentage}% · {h.category} ·{" "}
                {h.branch === "any" ? "Any branch" : h.branch} ·{" "}
                {h.city === "any" ? "Any city" : h.city}
              </p>
              <p className="text-xs text-ink/40">
                {new Date(h.searchedAt).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
