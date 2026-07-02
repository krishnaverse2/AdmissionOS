"use client";

import { useState } from "react";

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export default function CollegeWebSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WebSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setErrorMessage(null);
    setResults(null);

    try {
      const res = await fetch(`/api/search-colleges?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(
          data.message ?? "Something went wrong searching the web."
        );
        return;
      }
      setResults(data.results ?? []);
    } catch {
      setErrorMessage("Couldn't reach the search service. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
      <p className="font-mono-figures text-xs font-semibold uppercase tracking-widest text-indigo">
        Web search
      </p>
      <h2 className="mt-1 font-display text-lg font-bold text-ink">
        Look up any Maharashtra college
      </h2>
      <p className="mt-1 text-sm text-ink/60">
        Not sure if a college is in our predictor yet? Search the live web
        for it — official site, reviews, recent news.
      </p>

      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Fr. Conceicao Rodrigues College of Engineering"
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-md bg-indigo px-4 py-2 text-sm font-semibold text-paper hover:bg-indigo-light disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {errorMessage && (
        <p className="mt-4 rounded-md border border-chance-low/30 bg-chance-low-bg px-3 py-2 text-sm text-chance-low">
          {errorMessage}
        </p>
      )}

      {results && results.length === 0 && !errorMessage && (
        <p className="mt-4 text-sm text-ink/55">
          No results found. Try a more specific name or add the city.
        </p>
      )}

      {results && results.length > 0 && (
        <ul className="mt-4 space-y-3">
          {results.map((r, i) => (
            <li key={i} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-sm font-semibold text-indigo hover:underline"
              >
                {r.title}
              </a>
              <p className="mt-0.5 text-xs text-ink/45">{r.source}</p>
              {r.snippet && (
                <p className="mt-1 text-sm leading-relaxed text-ink/70">
                  {r.snippet}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-ink/40">
        These are live web results, not from our predictor database —
        cutoffs and placement figures here aren&rsquo;t verified by CAP
        Guru AI. Use the predictor above for chance-based recommendations.
      </p>
    </div>
  );
}
