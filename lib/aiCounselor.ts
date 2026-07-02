import "server-only";
import { predictColleges } from "@/lib/prediction";
import {
  getColleges,
  getBranches,
  getCityById,
  getBranchById,
  getPlacement,
} from "@/lib/repository";
import type { PredictionInput } from "@/lib/types";

export interface CounselorContext {
  // Optional last-known student inputs from the predictor, so the chat
  // can answer "which college is best for my marks" without re-asking.
  lastPrediction?: PredictionInput;
}

export interface CounselorAnswer {
  answer: string;
  usedData: boolean;
}

const DISCLAIMER =
  "This is based on previous cutoff and placement data available in CAP Guru AI. Final admission depends on official CAP rounds, seat availability, category reservation rules, and DTE/CET Cell updates.";

function findCollegeMention(message: string) {
  const colleges = getColleges();
  const lower = message.toLowerCase();
  return colleges.find(
    (c) =>
      lower.includes(c.shortName.toLowerCase()) ||
      lower.includes(c.name.toLowerCase())
  );
}

function findBranchMention(message: string) {
  const branches = getBranches();
  const lower = message.toLowerCase();
  return branches.find(
    (b) =>
      lower.includes(b.name.toLowerCase()) ||
      lower.includes(b.code.toLowerCase())
  );
}

/**
 * Very small intent router over canned question types. This is a stand-in
 * for an LLM call (OpenAI/Gemini) — the API route that calls this function
 * is the natural place to swap in a real model later, using this same
 * structured data as grounding context so the model "answers using only
 * available database data."
 */
export function answerCounselorQuestion(
  message: string,
  context: CounselorContext
): CounselorAnswer {
  const lower = message.toLowerCase();
  const mentionedCollege = findCollegeMention(message);
  const mentionedBranch = findBranchMention(message);

  // "Is <college> good for placement?"
  if (
    mentionedCollege &&
    (lower.includes("placement") || lower.includes("package"))
  ) {
    const branches = getBranches().filter((b) =>
      mentionedCollege.branchIds.includes(b.id)
    );
    const lines = branches
      .map((b) => {
        const p = getPlacement(mentionedCollege.id, b.id);
        if (!p) return null;
        return `${b.name}: ${p.placement_percentage}% placed, average package ₹${p.average_package} LPA, highest ₹${p.highest_package} LPA`;
      })
      .filter(Boolean);

    if (lines.length === 0) {
      return {
        answer: `I don't have placement data for ${mentionedCollege.shortName} in my database yet, so I can't give you a reliable answer on that.`,
        usedData: false,
      };
    }

    return {
      answer: `Here's what I have for ${mentionedCollege.shortName}:\n${lines.join(
        "\n"
      )}\n\n${DISCLAIMER}`,
      usedData: true,
    };
  }

  // "Should I choose CO or IT?" / branch vs branch
  if (
    lower.includes(" or ") &&
    (lower.includes("branch") ||
      mentionedBranch ||
      lower.match(/\bco\b|\bit\b|\bentc\b|\bai\s?&?\s?ds\b|\bai\s?&?\s?ml\b/))
  ) {
    const branches = getBranches();
    const mentioned = branches.filter(
      (b) =>
        lower.includes(b.code.toLowerCase()) ||
        lower.includes(b.name.toLowerCase())
    );

    if (mentioned.length >= 2) {
      const summaries = mentioned.map((b) => {
        const allPlacements = getColleges()
          .filter((c) => c.branchIds.includes(b.id))
          .map((c) => getPlacement(c.id, b.id))
          .filter(Boolean) as NonNullable<ReturnType<typeof getPlacement>>[];
        const avgPkg =
          allPlacements.reduce((s, p) => s + p.average_package, 0) /
          (allPlacements.length || 1);
        return `${b.name} (${b.code}): average package across colleges in my data is roughly ₹${avgPkg.toFixed(
          1
        )} LPA, demand tier "${b.demandTier}" (higher demand tiers usually mean higher cutoffs).`;
      });

      return {
        answer: `Comparing what I have:\n${summaries.join(
          "\n"
        )}\n\nIf placement package matters most to you, lean toward the one with the higher average above. If you'd rather have an easier cutoff with a still-solid outcome, the lower-demand-tier branch is usually more accessible. ${DISCLAIMER}`,
        usedData: true,
      };
    }
  }

  // "Should I wait for next CAP round?"
  if (lower.includes("wait") && lower.includes("round")) {
    return {
      answer:
        "I don't have live, round-by-round seat vacancy data, so I can't tell you with certainty whether waiting will help in your specific case. As a general pattern from past CAP cycles: cutoffs for the same college/branch usually ease slightly in later rounds as higher-scoring students move to other colleges, but popular branches (CO, IT, AI&DS) often stay competitive across all rounds. If you already have a confirmed seat that meets your priorities, many students choose to freeze it rather than risk losing it while waiting. " +
        DISCLAIMER,
      usedData: false,
    };
  }

  // "Make my preference list" — point to the dedicated tool, but use
  // last known prediction if we have one.
  if (
    lower.includes("preference list") ||
    lower.includes("option form") ||
    lower.includes("cap form")
  ) {
    if (context.lastPrediction) {
      return {
        answer:
          "I can do that — head to the Preference List page and I'll use the marks, category, branch, and city you already entered to generate a Dream / Target / Safe list in CAP option-form order.",
        usedData: true,
      };
    }
    return {
      answer:
        "I'd be happy to generate a preference list, but I need your diploma percentage, category, and branch/city preference first. Go to the predictor form, fill that in, and then come back here or use the Preference List page.",
      usedData: false,
    };
  }

  // "Which college is best for my marks?"
  if (
    lower.includes("best college") ||
    lower.includes("best for my marks") ||
    lower.includes("which college")
  ) {
    if (!context.lastPrediction) {
      return {
        answer:
          "I don't have your marks, category, or branch preference yet — fill in the predictor form first so I'm working from your actual data rather than guessing.",
        usedData: false,
      };
    }
    const results = predictColleges(context.lastPrediction).slice(0, 3);
    if (results.length === 0) {
      return {
        answer:
          "Based on the filters you set (city, branch, category, budget), I couldn't find a matching college in my current database. Try widening your city or branch preference.",
        usedData: false,
      };
    }
    const lines = results.map(
      (r, i) =>
        `${i + 1}. ${r.shortName} — ${r.branchName} — ${r.chance} chance (last year's cutoff ${r.previousCutoff}%, avg package ₹${r.averagePackage} LPA)`
    );
    return {
      answer: `Based on your saved inputs, here are your strongest matches right now:\n${lines.join(
        "\n"
      )}\n\n${DISCLAIMER}`,
      usedData: true,
    };
  }

  // Direct college lookup fallback
  if (mentionedCollege) {
    const city = getCityById(mentionedCollege.cityId);
    return {
      answer: `${mentionedCollege.name} is a ${mentionedCollege.type} college in ${city?.name}. It offers ${mentionedCollege.branchIds
        .map((id) => getBranchById(id)?.code)
        .filter(Boolean)
        .join(", ")}. Ask me about its placement, cutoff for a specific branch, or fees and I can pull that up.`,
      usedData: true,
    };
  }

  // Generic fallback — be explicit that we don't have grounded data for this.
  return {
    answer:
      'I can only answer using the cutoff, placement, and fee data in my database right now — I don\'t have an answer grounded in that data for this specific question. Try asking about a specific college\'s placement, comparing two branches, or say "which college is best for my marks" after filling the predictor form.',
    usedData: false,
  };
}

export type { PredictionInput };
