"use client";

import type { PredictionInput } from "@/lib/types";

const LAST_PREDICTION_KEY = "cgai_last_prediction";
const SEARCH_HISTORY_KEY = "cgai_search_history";

export function saveLastPrediction(input: PredictionInput) {
  try {
    localStorage.setItem(LAST_PREDICTION_KEY, JSON.stringify(input));
    const history = getSearchHistory();
    history.unshift({ ...input, searchedAt: new Date().toISOString() });
    localStorage.setItem(
      SEARCH_HISTORY_KEY,
      JSON.stringify(history.slice(0, 10))
    );
  } catch {
    // localStorage unavailable (e.g. private mode) — fail silently,
    // the predictor still works without persistence.
  }
}

export function getLastPrediction(): PredictionInput | null {
  try {
    const raw = localStorage.getItem(LAST_PREDICTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getSearchHistory(): (PredictionInput & {
  searchedAt: string;
})[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
