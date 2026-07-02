import "server-only";
import { predictColleges } from "@/lib/prediction";
import type {
  PredictionInput,
  PreferenceListResult,
  PreferenceListEntry,
} from "@/lib/types";

function reasonFor(entry: Omit<PreferenceListEntry, "tier" | "reason" | "rank">): string {
  const parts: string[] = [];
  if (entry.chance === "High") {
    parts.push(`your percentage is above last year's ${entry.previousCutoff}% cutoff`);
  } else if (entry.chance === "Medium") {
    parts.push(`your percentage is close to last year's ${entry.previousCutoff}% cutoff`);
  } else {
    parts.push(`last year's cutoff (${entry.previousCutoff}%) was above your percentage`);
  }
  if (entry.placementPercentage >= 80) {
    parts.push(`strong placement record (${entry.placementPercentage}%)`);
  }
  if (entry.collegeType === "Government") {
    parts.push("low government fee structure");
  }
  return parts.join("; ");
}

/**
 * Generates a CAP option-form-style preference list, ordered and split
 * into Dream (stretch), Target (realistic), and Safe (secure) tiers,
 * matching how students actually fill the official CAP form: dreams
 * first, then realistic options, then safety nets.
 */
export function generatePreferenceList(
  input: PredictionInput
): PreferenceListResult {
  const allResults = predictColleges(input);

  const dream = allResults.filter((r) => r.chance === "Low");
  const target = allResults.filter((r) => r.chance === "Medium");
  const safe = allResults.filter((r) => r.chance === "High");

  // Within each tier, order Dream by closest-to-reach first (smallest gap),
  // Target by best placement (if priority) else by cutoff proximity,
  // Safe by best placement / fee value so the "safest of the safe" still
  // makes sense to put high on the list.
  dream.sort((a, b) => a.previousCutoff - b.previousCutoff);
  target.sort((a, b) => b.averagePackage - a.averagePackage);
  safe.sort((a, b) => b.averagePackage - a.averagePackage);

  function toEntries(
    list: typeof allResults,
    tier: PreferenceListEntry["tier"]
  ): PreferenceListEntry[] {
    return list.map((entry, idx) => ({
      ...entry,
      tier,
      reason: reasonFor(entry),
      rank: idx + 1,
    }));
  }

  return {
    generatedAt: new Date().toISOString(),
    input,
    dream: toEntries(dream, "Dream"),
    target: toEntries(target, "Target"),
    safe: toEntries(safe, "Safe"),
  };
}
