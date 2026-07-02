import { NextRequest, NextResponse } from "next/server";

// ---- Provider seam ----
// This route calls one external search provider. To swap providers,
// replace the body of `searchWeb()` with the equivalent call for your
// provider (SerpAPI, Tavily, etc.) and keep the same return shape.
// Default: Brave Search API (https://brave.com/search/api/).
// Set BRAVE_SEARCH_API_KEY in your .env.local — see README "Web search
// setup" for how to get a key.

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

async function searchWeb(query: string): Promise<WebSearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }

  const params = new URLSearchParams({
    q: query,
    count: "8",
    country: "IN",
    search_lang: "en",
  });

  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
      // Brave responses for the same query barely change minute to
      // minute; cache briefly so repeated lookups of a popular college
      // don't burn paid query credits.
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("INVALID_API_KEY");
    }
    if (res.status === 429) {
      throw new Error("RATE_LIMITED");
    }
    throw new Error(`PROVIDER_ERROR_${res.status}`);
  }

  const data = await res.json();
  const results = (data?.web?.results ?? []) as Array<{
    title?: string;
    url?: string;
    description?: string;
  }>;

  return results.slice(0, 8).map((r) => ({
    title: r.title ?? "Untitled",
    url: r.url ?? "",
    snippet: (r.description ?? "").replace(/<[^>]+>/g, ""),
    source: r.url ? new URL(r.url).hostname.replace(/^www\./, "") : "",
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required." },
      { status: 400 }
    );
  }

  // Bias toward Maharashtra engineering-college results without forcing
  // an exact phrase match, so "VIT Pune" or "best college for IT Nagpur"
  // both work.
  const biasedQuery = /maharashtra/i.test(q)
    ? q
    : `${q} Maharashtra engineering college`;

  try {
    const results = await searchWeb(biasedQuery);
    return NextResponse.json({ query: q, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN";

    if (message === "MISSING_API_KEY") {
      return NextResponse.json(
        {
          error: "SEARCH_NOT_CONFIGURED",
          message:
            "Web search isn't set up yet. Add BRAVE_SEARCH_API_KEY to .env.local — see the README for setup steps.",
        },
        { status: 503 }
      );
    }
    if (message === "INVALID_API_KEY") {
      return NextResponse.json(
        {
          error: "SEARCH_AUTH_FAILED",
          message:
            "The search API key was rejected. Double-check BRAVE_SEARCH_API_KEY in .env.local.",
        },
        { status: 502 }
      );
    }
    if (message === "RATE_LIMITED") {
      return NextResponse.json(
        {
          error: "SEARCH_RATE_LIMITED",
          message: "Search provider rate limit hit. Try again in a moment.",
        },
        { status: 429 }
      );
    }

    console.error("Web search failed:", err);
    return NextResponse.json(
      { error: "SEARCH_FAILED", message: "Couldn't complete the search." },
      { status: 502 }
    );
  }
}
