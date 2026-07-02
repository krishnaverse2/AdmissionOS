"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ChanceBadge from "@/components/ChanceBadge";
import type { PredictionInput, PreferenceListResult } from "@/lib/types";

const TIER_CONFIG = {
  Dream: {
    title: "Dream options",
    blurb: "A stretch — your percentage is below last year's cutoff. Worth trying, but don't count on it.",
    accent: "border-chance-low/40",
  },
  Target: {
    title: "Target options",
    blurb: "Realistic picks — your percentage is close to last year's cutoff for these.",
    accent: "border-chance-medium/40",
  },
  Safe: {
    title: "Safe options",
    blurb: "Secure picks — your percentage comfortably clears last year's cutoff here.",
    accent: "border-chance-high/40",
  },
} as const;

export default function PreferenceListClient() {
  const [list, setList] = useState<PreferenceListResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input] = useState<PredictionInput | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("cgai_predict_input");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!input) return;

    fetch("/api/generate-preference-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setList(data);
      })
      .catch(() => setError("Couldn't generate your preference list."));
  }, [input]);

  if (!input) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-lg font-bold text-ink">
          Run the predictor first
        </p>
        <p className="mt-2 text-sm text-ink/60">
          Your preference list is built from the marks, category, and
          preferences you enter in the predictor. Fill that in first, then
          come back here from your results.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-md bg-indigo px-5 py-2.5 text-sm font-semibold text-paper hover:bg-indigo-light"
        >
          Go to predictor
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 text-center">
        <p className="text-chance-low">{error}</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 text-center text-sm text-ink/60">
        Building your CAP option-form order…
      </div>
    );
  }

  let globalRank = 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono-figures text-xs font-semibold uppercase tracking-widest text-indigo">
            CAP option form order
          </p>
          <h1 className="font-display text-2xl font-bold text-ink">
            Your preference list
          </h1>
        </div>
        <Link
          href="/results"
          className="rounded-md border border-line px-3 py-2 text-sm font-medium text-ink/70 hover:border-indigo hover:text-indigo"
        >
          ← Back to results
        </Link>
      </div>

      <div className="space-y-8">
        {(["Dream", "Target", "Safe"] as const).map((tierKey) => {
          const entries = list[tierKey.toLowerCase() as "dream" | "target" | "safe"];
          const config = TIER_CONFIG[tierKey];
          if (entries.length === 0) return null;
          return (
            <section key={tierKey}>
              <h2 className="font-display text-lg font-bold text-ink">
                {config.title}{" "}
                <span className="text-sm font-normal text-ink/50">
                  ({entries.length})
                </span>
              </h2>
              <p className="mt-1 text-sm text-ink/60">{config.blurb}</p>
              <ol className={`mt-3 space-y-2`}>
                {entries.map((entry) => {
                  globalRank += 1;
                  return (
                    <li
                      key={`${entry.collegeId}-${entry.branchId}`}
                      className={`rounded-lg border bg-white p-4 ${config.accent}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono-figures text-sm font-bold text-ink/40">
                            {globalRank}.
                          </span>
                          <div>
                            <Link
                              href={`/college/${entry.collegeId}`}
                              className="font-display font-semibold text-ink hover:text-indigo"
                            >
                              {entry.shortName}
                            </Link>
                            <span className="text-ink/60"> — {entry.branchName}</span>
                          </div>
                        </div>
                        <ChanceBadge chance={entry.chance} />
                      </div>
                      <p className="mt-2 text-sm text-ink/70">{entry.reason}.</p>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-ink/45">
        This prediction is based on previous cutoff data and available
        college information. Final admission depends on official CAP
        rounds, seat availability, category reservation rules, and
        DTE/CET Cell updates.
      </p>
    </div>
  );
}
