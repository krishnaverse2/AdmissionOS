import "server-only";

import { predictColleges } from "@/lib/prediction";
import {
  getColleges,
  getBranches,
  getCityById,
  getBranchById,
  getPlacement,
  getFee,
  getCutoff,
} from "@/lib/repository";
import type { PredictionInput, College, Branch, PredictionResult } from "@/lib/types";

export interface CounselorContext {
  lastPrediction?: PredictionInput;
}

export interface CounselorAnswer {
  answer: string;
  usedData: boolean;
}

const DISCLAIMER =
  "Note: This is based on available cutoff, fee and placement/package data in AdmissionOS. Final admission depends on official CAP rounds, seat availability, category rules and CET Cell updates.";

function money(value: number | null | undefined) {
  if (!value || value <= 0) return "N/A";
  return `₹${value} LPA`;
}

function fee(value: number | null | undefined) {
  if (!value || value <= 0) return "N/A";
  return `₹${value.toLocaleString("en-IN")}`;
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findCollegeMention(message: string): College | undefined {
  const lower = normalize(message);
  const colleges = getColleges();

  return colleges.find((college) => {
    const fullName = normalize(college.name);
    const shortName = normalize(college.shortName);

    return (
      lower.includes(fullName) ||
      lower.includes(shortName) ||
      shortName
        .split(" ")
        .filter(Boolean)
        .some((part) => part.length >= 3 && lower.includes(part))
    );
  });
}

function findBranchMention(message: string): Branch | undefined {
  const lower = normalize(message);
  const branches = getBranches();

  const aliases: Record<string, string[]> = {
    "computer-engineering": ["co", "computer", "computer engineering", "cs", "cse"],
    "computer-science-and-engineering": ["cse", "cs", "computer science"],
    "information-technology": ["it", "information technology"],
    "artificial-intelligence-and-data-science": ["aids", "ai ds", "ai and ds", "data science"],
    "artificial-intelligence-and-machine-learning": ["aiml", "ai ml", "ai and ml"],
    "electronics-and-telecommunication-engg": ["entc", "extc", "electronics"],
  };

  for (const branch of branches) {
    const branchName = normalize(branch.name);
    const branchCode = normalize(branch.code);

    if (lower.includes(branchName) || lower.includes(branchCode)) {
      return branch;
    }

    const list = aliases[branch.id] ?? [];
    if (list.some((alias) => lower.includes(normalize(alias)))) {
      return branch;
    }
  }

  return undefined;
}

function getBestPlacementForCollege(college: College) {
  const rows = college.branchIds
    .map((branchId) => {
      const branch = getBranchById(branchId);
      const placement = getPlacement(college.id, branchId);

      if (!branch || !placement) return null;

      return {
        branch,
        placement,
      };
    })
    .filter(Boolean) as {
    branch: Branch;
    placement: NonNullable<ReturnType<typeof getPlacement>>;
  }[];

  rows.sort(
    (a, b) =>
      b.placement.average_package - a.placement.average_package ||
      b.placement.highest_package - a.placement.highest_package
  );

  return rows;
}

function collegeOverview(college: College) {
  const city = getCityById(college.cityId);
  const feeData = getFee(college.id);
  const totalFee =
    (feeData?.tuition_fee ?? 0) +
    (feeData?.hostel_fee ?? 0) +
    (feeData?.other_fee ?? 0);

  const branches = college.branchIds
    .map((id) => getBranchById(id)?.name)
    .filter(Boolean)
    .slice(0, 8);

  const placements = getBestPlacementForCollege(college).slice(0, 3);

  const placementText =
    placements.length > 0
      ? placements
          .map(
            (p, i) =>
              `${i + 1}. ${p.branch.name}: Avg ${money(
                p.placement.average_package
              )}, Highest ${money(p.placement.highest_package)}, Placement ${
                p.placement.placement_percentage
              }%`
          )
          .join("\n")
      : "Placement/package data is not available yet.";

  return `${college.name}

City: ${city?.name ?? college.cityId}
Type: ${college.type}
Hostel: ${college.hostel ? "Available" : "Not available"}
Approx. yearly fee: ${fee(totalFee)}

Available branches:
${branches.map((b) => `• ${b}`).join("\n")}

Best package data:
${placementText}

${DISCLAIMER}`;
}

function topPredictionLines(results: PredictionResult[], limit = 5) {
  return results.slice(0, limit).map((r, index) => {
    return `${index + 1}. ${r.collegeName} — ${r.branchName}
   Chance: ${r.chance}
   Last cutoff: ${r.previousCutoff}%
   Expected cutoff: ${r.expectedCutoff.min}% - ${r.expectedCutoff.max}%
   Avg package: ${money(r.averagePackage)}
   Highest package: ${money(r.highestPackage)}
   Fee/year: ${fee(r.totalFee)}`;
  });
}

function answerBestCollege(context: CounselorContext): CounselorAnswer {
  if (!context.lastPrediction) {
    return {
      usedData: false,
      answer:
        "First fill the predictor form with your percentage, category, city and branch. Then I can suggest colleges based on your actual profile instead of guessing.",
    };
  }

  const results = predictColleges(context.lastPrediction);

  if (results.length === 0) {
    return {
      usedData: false,
      answer:
        "I could not find matching colleges with your current filters. Try selecting Any city or Any branch, then run the predictor again.",
    };
  }

  const high = results.filter((r) => r.chance === "High");
  const medium = results.filter((r) => r.chance === "Medium");
  const low = results.filter((r) => r.chance === "Low");

  const best = [...high, ...medium, ...low].slice(0, 5);

  return {
    usedData: true,
    answer: `Based on your saved profile, these are your best options:

${topPredictionLines(best, 5).join("\n\n")}

My advice:
• Put 2-3 Dream colleges first.
• Then add Target colleges where your chance is Medium.
• Keep enough Safe colleges at the bottom.
• For placement, prefer colleges with stronger average package and better branch demand.

${DISCLAIMER}`,
  };
}

function answerBranchAdvice(message: string): CounselorAnswer {
  const lower = normalize(message);

  const computerBranches = [
    "computer-engineering",
    "computer-science-and-engineering",
    "information-technology",
    "artificial-intelligence-and-data-science",
    "artificial-intelligence-and-machine-learning",
    "computer-science-and-engineering-artificial-intelligence-and-machine-learning",
    "computer-science-and-engineering-data-science",
    "data-science",
    "cyber-security",
  ];

  if (
    lower.includes("co") ||
    lower.includes("computer") ||
    lower.includes("it") ||
    lower.includes("aids") ||
    lower.includes("aiml") ||
    lower.includes("branch")
  ) {
    return {
      usedData: true,
      answer: `For placement-focused students, the usual branch priority is:

1. Computer Engineering / CSE
   Best overall for software jobs, coding roles, product companies and internships.

2. Information Technology
   Almost equal to Computer Engineering in many colleges. Good choice if CO cutoff is high.

3. AI & DS / AIML
   Good modern branches, especially if college has strong CS placements. Choose this in a better college instead of CO in a weak college.

4. ENTC / Electronics
   Good if you are interested in hardware, telecom, embedded or VLSI, but software placement can depend more on your coding skills.

My simple rule:
Better college + IT/AI&DS is often better than weaker college + Computer.

Computer-related branches in your database:
${computerBranches
  .map((id) => getBranchById(id)?.name)
  .filter(Boolean)
  .map((b) => `• ${b}`)
  .join("\n")}

${DISCLAIMER}`,
    };
  }

  const branch = findBranchMention(message);

  if (!branch) {
    return {
      usedData: false,
      answer:
        "Tell me the branch name, for example CO, IT, AI&DS, AIML, ENTC, Mechanical or Civil. Then I can guide you better.",
    };
  }

  return {
    usedData: true,
    answer: `${branch.name} is a ${branch.demandTier}-demand branch in AdmissionOS data.

General advice:
• High-demand branches usually have better placement competition and higher cutoffs.
• If your goal is software placement, prefer CO / CSE / IT / AI&DS / AIML.
• If you want core jobs, choose branch based on your actual interest, not only package.

${DISCLAIMER}`,
  };
}

function answerCollegePlacement(college: College): CounselorAnswer {
  const rows = getBestPlacementForCollege(college);

  if (rows.length === 0) {
    return {
      usedData: false,
      answer: `I do not have package data for ${college.shortName} yet. Check the official placement page before final decision.`,
    };
  }

  const lines = rows.slice(0, 8).map((row, index) => {
    return `${index + 1}. ${row.branch.name}: Avg ${money(
      row.placement.average_package
    )}, Highest ${money(row.placement.highest_package)}, Placement ${
      row.placement.placement_percentage
    }%`;
  });

  return {
    usedData: true,
    answer: `Placement/package data for ${college.shortName}:

${lines.join("\n")}

My view:
• Check average package more than highest package.
• Highest package can be from 1-2 students only.
• For real placement strength, compare average package + placement percentage + branch.

${DISCLAIMER}`,
  };
}

function answerCutoff(message: string, context: CounselorContext): CounselorAnswer {
  const college = findCollegeMention(message);
  const branch = findBranchMention(message);

  if (college && branch) {
    const category =
      context.lastPrediction?.category ??
      (message.toUpperCase().includes("OBC") ? "GOBC" : "GOPEN");

    const cutoff =
      getCutoff(college.id, branch.id, category) ??
      getCutoff(college.id, branch.id, "GOPEN");

    if (!cutoff) {
      return {
        usedData: false,
        answer: `I do not have cutoff data for ${college.shortName} - ${branch.name} in my database.`,
      };
    }

    return {
      usedData: true,
      answer: `${college.shortName} - ${branch.name}

Category used: ${cutoff.category_id}
Last cutoff: ${cutoff.cutoff_percentage}%
Cutoff rank: ${cutoff.cutoff_rank}
Round: ${cutoff.round}
Year: ${cutoff.year}

${DISCLAIMER}`,
    };
  }

  if (context.lastPrediction) {
    return answerBestCollege(context);
  }

  return {
    usedData: false,
    answer:
      "Please mention college + branch, like: 'VIT Pune Computer cutoff' or run the predictor first.",
  };
}

function answerCapStrategy(context: CounselorContext): CounselorAnswer {
  if (!context.lastPrediction) {
    return {
      usedData: false,
      answer:
        "For CAP strategy, first run the predictor. Then I can divide your options into Dream, Target and Safe colleges.",
    };
  }

  const results = predictColleges(context.lastPrediction);
  const dream = results.filter((r) => r.chance === "Low").slice(0, 3);
  const target = results.filter((r) => r.chance === "Medium").slice(0, 4);
  const safe = results.filter((r) => r.chance === "High").slice(0, 5);

  return {
    usedData: true,
    answer: `CAP preference strategy for your profile:

Dream options:
${dream.length ? topPredictionLines(dream, 3).join("\n\n") : "No dream options found."}

Target options:
${target.length ? topPredictionLines(target, 4).join("\n\n") : "No target options found."}

Safe options:
${safe.length ? topPredictionLines(safe, 5).join("\n\n") : "No safe options found."}

Best order:
1. Put high-placement dream colleges first.
2. Put realistic target colleges after that.
3. Put safe colleges last, but do not ignore them.
4. Never put a college above another if you do not actually want it.

${DISCLAIMER}`,
  };
}

function answerCompare(message: string): CounselorAnswer {
  const lower = normalize(message);
  const colleges = getColleges().filter((c) => {
    const shortName = normalize(c.shortName);
    const fullName = normalize(c.name);
    return lower.includes(shortName) || lower.includes(fullName);
  });

  if (colleges.length < 2) {
    return {
      usedData: false,
      answer:
        "Tell me two college names to compare, for example: 'Compare VIT Pune and PCCOE'.",
    };
  }

  const selected = colleges.slice(0, 3);

  const lines = selected.map((college, index) => {
    const city = getCityById(college.cityId);
    const placements = getBestPlacementForCollege(college);
    const best = placements[0];
    const feeData = getFee(college.id);
    const totalFee =
      (feeData?.tuition_fee ?? 0) +
      (feeData?.hostel_fee ?? 0) +
      (feeData?.other_fee ?? 0);

    return `${index + 1}. ${college.shortName}
   City: ${city?.name ?? college.cityId}
   Type: ${college.type}
   Best avg package: ${best ? money(best.placement.average_package) : "N/A"}
   Best highest package: ${best ? money(best.placement.highest_package) : "N/A"}
   Fee/year: ${fee(totalFee)}
   Hostel: ${college.hostel ? "Available" : "No"}`;
  });

  return {
    usedData: true,
    answer: `College comparison:

${lines.join("\n\n")}

My advice:
Choose based on this order:
1. Placement and average package
2. Branch availability
3. Cutoff chance
4. Location
5. Fees and hostel

${DISCLAIMER}`,
  };
}

export function answerCounselorQuestion(
  message: string,
  context: CounselorContext
): CounselorAnswer {
  const lower = normalize(message);
  const college = findCollegeMention(message);

  if (
    lower.includes("best college") ||
    lower.includes("best for my marks") ||
    lower.includes("which college") ||
    lower.includes("college for my marks") ||
    lower.includes("suggest college")
  ) {
    return answerBestCollege(context);
  }

  if (
    lower.includes("preference") ||
    lower.includes("option form") ||
    lower.includes("cap list") ||
    lower.includes("make my list")
  ) {
    return answerCapStrategy(context);
  }

  if (
    lower.includes("wait") ||
    lower.includes("next round") ||
    lower.includes("cap round") ||
    lower.includes("freeze") ||
    lower.includes("float")
  ) {
    return {
      usedData: true,
      answer: `CAP round advice:

• If you got a good college + good branch + acceptable fees, freezing is safe.
• If you got a lower preference and your Dream/Target colleges are close by cutoff, floating can help.
• Later rounds may reduce cutoff slightly, but top branches like CO, IT, AI&DS and AIML usually remain competitive.
• Do not take risk if you have only one safe option.

Best strategy:
Keep Dream → Target → Safe order in preference list and do not add colleges you do not want.

${DISCLAIMER}`,
    };
  }

  if (
    lower.includes("placement") ||
    lower.includes("package") ||
    lower.includes("salary") ||
    lower.includes("lpa")
  ) {
    if (college) return answerCollegePlacement(college);

    if (context.lastPrediction) {
      const results = predictColleges(context.lastPrediction)
        .sort(
          (a, b) =>
            b.averagePackage - a.averagePackage ||
            b.highestPackage - a.highestPackage
        )
        .slice(0, 5);

      return {
        usedData: true,
        answer: `Best package options from your saved profile:

${topPredictionLines(results, 5).join("\n\n")}

My advice:
Average package matters more than highest package. Also check cutoff chance before putting a college too high.

${DISCLAIMER}`,
      };
    }

    return {
      usedData: false,
      answer:
        "Tell me a college name, like 'VIT Pune placement', or run the predictor first so I can suggest best package colleges for your marks.",
    };
  }

  if (
    lower.includes("cutoff") ||
    lower.includes("rank") ||
    lower.includes("percentage")
  ) {
    return answerCutoff(message, context);
  }

  if (
    lower.includes("co") ||
    lower.includes("it") ||
    lower.includes("aids") ||
    lower.includes("aiml") ||
    lower.includes("branch") ||
    lower.includes("computer")
  ) {
    return answerBranchAdvice(message);
  }

  if (
    lower.includes("compare") ||
    lower.includes("vs") ||
    lower.includes("better")
  ) {
    return answerCompare(message);
  }

  if (college) {
    return {
      usedData: true,
      answer: collegeOverview(college),
    };
  }

  return {
    usedData: false,
    answer: `I can help you with:
• Best college for your marks
• CO vs IT vs AI&DS branch choice
• Placement/package comparison
• Cutoff and CAP round strategy
• Preference list order
• College comparison

Try asking:
"Which college is best for my marks?"
"Compare VIT Pune and PCCOE"
"Should I choose CO or IT?"
"Which college has best package?"

${DISCLAIMER}`,
  };
}

export type { PredictionInput };