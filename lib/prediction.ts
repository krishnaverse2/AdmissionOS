import "server-only";

import {
  getColleges,
  getCutoff,
  getPlacement,
  getFee,
  getCityById,
  getBranchById,
  getBranches,
} from "@/lib/repository";
import type {
  PredictionInput,
  PredictionResult,
  ExpectedCutoffRange,
  ChanceLevel,
  College,
} from "@/lib/types";

const BRANCH_DEMAND_ADJUSTMENT: Record<string, number> = {
  high: 1.5,
  medium: 0.7,
  low: 0.2,
};

const PUNE_REGION = [
  "pune",
  "coep",
  "bibwewadi",
  "pimpri",
  "chinchwad",
  "pimpri chinchwad",
  "akurdi",
  "ravet",
  "tathawade",
  "hinjawadi",
  "wagholi",
  "hadapsar",
  "narhe",
  "karvenagar",
  "alandi",
  "talegaon",
];

const MUMBAI_REGION = [
  "mumbai",
  "veermata",
  "vjti",
  "matunga",
  "andheri",
  "bandra",
  "vile parle",
  "chembur",
  "sion",
  "wadala",
  "kandivali",
  "byculla",
  "navi mumbai",
  "navi-mumbai",
  "kharghar",
  "thane",
  "panvel",
  "kalyan",
  "dombivli",
  "vasai",
  "virar",
  "airoli",
  "nerul",
  "vashi",
];

const COLLEGE_REPUTATION_SCORE: Record<string, number> = {
  // Mumbai / top state colleges
  "3012": 100, // VJTI
  "3014": 98, // SPCE
  "3199": 96, // DJ Sanghvi
  "3182": 94, // Thadomal Shahani
  "3184": 92, // Fr. CRCE Bandra
  "3185": 91, // VESIT
  "3139": 88, // Vidyalankar
  "3176": 86, // Thakur
  "3197": 84, // Fr. C. Rodrigues Vashi
  "3148": 82, // Shah & Anchor

  // Pune / Western Maharashtra
  "6006": 100, // COEP
  "6271": 97, // PICT
  "6273": 95, // VIT Pune
  "6007": 94, // Walchand Sangli
  "6272": 90, // D.Y. Patil Akurdi
  "6822": 88, // PCCOER Ravet
};

const COLLEGE_NAME_BONUS: { pattern: RegExp; score: number }[] = [
  { pattern: /coep|college of engineering pune/i, score: 100 },
  { pattern: /veermata|vjti|jijabai technological/i, score: 100 },
  { pattern: /pune institute of computer technology|pict/i, score: 97 },
  { pattern: /vishwakarma institute of technology|vit.*pune/i, score: 95 },
  { pattern: /walchand college of engineering/i, score: 94 },
  { pattern: /dwarkadas.*sanghvi|d\.?\s*j\.?\s*sanghvi/i, score: 96 },
  { pattern: /sardar patel college of engineering/i, score: 98 },
  { pattern: /thadomal shahani/i, score: 94 },
  { pattern: /fr\.?\s*conceicao|fr\.?\s*c\.?\s*rodrigues.*bandra/i, score: 92 },
  { pattern: /vivekanand education.*technology|vesit/i, score: 91 },
  { pattern: /vidyalankar/i, score: 88 },
  { pattern: /thakur college of engineering/i, score: 86 },
  { pattern: /pimpri chinchwad.*ravet|pccoer/i, score: 88 },
  { pattern: /d\.?\s*y\.?\s*patil.*akurdi/i, score: 90 },
];

function normalizeText(value: string): string {
  return value.toLowerCase().replaceAll("-", " ").replace(/\s+/g, " ").trim();
}

function collegeSearchText(college: College): string {
  return normalizeText(
    `${college.id} ${college.name} ${college.shortName} ${college.cityId} ${college.address}`
  );
}

function isInRegion(college: College, region: string): boolean {
  const text = collegeSearchText(college);

  if (region === "pune") {
    return PUNE_REGION.some((keyword) =>
      text.includes(normalizeText(keyword))
    );
  }

  if (region === "mumbai") {
    return MUMBAI_REGION.some((keyword) =>
      text.includes(normalizeText(keyword))
    );
  }

  return text.includes(normalizeText(region));
}

function getBranchGroupIds(selectedBranch: string): string[] {
  const branches = getBranches();

  if (selectedBranch === "any") return branches.map((b) => b.id);

  const isComputer = (name: string) =>
    /computer|information technology|artificial intelligence|machine learning|data science|cyber|iot|software|block chain|internet of things/i.test(
      name
    );

  const isElectronics = (name: string) =>
    /electronics|telecommunication|communication|vlsi|instrumentation|5g/i.test(
      name
    );

  const isElectrical = (name: string) => /electrical|power/i.test(name);

  const isMechanical = (name: string) =>
    /mechanical|mechatronics|automobile|production/i.test(name);

  const isCivil = (name: string) =>
    /civil|infrastructure|structural|environmental/i.test(name);

  const isRobotics = (name: string) => /robotics|automation/i.test(name);

  const isChemical = (name: string) =>
    /chemical|petro|food|paint|oil|plastic|polymer|pharmaceutical/i.test(name);

  const groupMap: Record<string, (name: string) => boolean> = {
    "group-computer": isComputer,
    "group-electronics": isElectronics,
    "group-electrical": isElectrical,
    "group-mechanical": isMechanical,
    "group-civil": isCivil,
    "group-robotics": isRobotics,
    "group-chemical": isChemical,
    "group-other": (name) =>
      !isComputer(name) &&
      !isElectronics(name) &&
      !isElectrical(name) &&
      !isMechanical(name) &&
      !isCivil(name) &&
      !isRobotics(name) &&
      !isChemical(name),
  };

  if (selectedBranch.startsWith("group-")) {
    const matcher = groupMap[selectedBranch];

    if (!matcher) return [];

    return branches.filter((b) => matcher(b.name)).map((b) => b.id);
  }

  return [selectedBranch];
}

function seatAvailabilityAdjustment(college: College): number {
  const seatProxy = college.branchIds.length;
  return seatProxy >= 7 ? 0.8 : seatProxy >= 5 ? 0.4 : 0;
}

function normalizeCategory(input: PredictionInput): string {
  if (input.gender === "Female") {
    const femaleMap: Record<string, string> = {
      GOPEN: "LOPEN",
      GOBC: "LOBC",
      GSC: "LSC",
      GST: "LST",
      GSEBC: "LSEBC",
      GNTA: "LNTA",
      GNTB: "LNTB",
      GNTC: "LNTC",
      GNTD: "LNTD",
    };

    return femaleMap[input.category] ?? input.category;
  }

  return input.category;
}

function getManualCollegeScore(college: College): number {
  const directScore = COLLEGE_REPUTATION_SCORE[college.id];

  if (directScore) return directScore;

  const text = `${college.name} ${college.shortName}`;

  const matched = COLLEGE_NAME_BONUS.find((item) => item.pattern.test(text));

  return matched?.score ?? 0;
}

function calculateCollegeQualityScore(
  college: College,
  previousCutoff: number,
  averagePackage: number,
  branchDemandTier: "high" | "medium" | "low"
): number {
  const manualScore = getManualCollegeScore(college);

  let score = 0;

  // Reputation should dominate sorting.
  if (manualScore > 0) {
    score += manualScore * 10;
  }

  // Cutoff still matters, but it should not push weaker colleges above COEP/VJTI/PICT.
  score += previousCutoff * 1.4;

  if (college.type === "Government") score += 40;
  else if (college.type === "Autonomous") score += 32;
  else score += 14;

  if (averagePackage > 0) {
    score += Math.min(averagePackage, 25) * 8;
  }

  if (branchDemandTier === "high") score += 35;
  else if (branchDemandTier === "medium") score += 18;
  else score += 5;

  if (college.branchIds.length >= 7) score += 10;
  else if (college.branchIds.length >= 5) score += 5;

  return Math.round(score * 100) / 100;
}

export function calculateExpectedCutoff(
  college: College,
  branchId: string,
  previousCutoff: number
): ExpectedCutoffRange {
  const branch = getBranchById(branchId);
  const branchAdj = branch ? BRANCH_DEMAND_ADJUSTMENT[branch.demandTier] : 0;
  const seatAdj = seatAvailabilityAdjustment(college);
  const expected = previousCutoff + branchAdj - seatAdj;
  const clamped = Math.max(35, Math.min(99.95, expected));

  return {
    point: Math.round(clamped * 100) / 100,
    min: Math.round(Math.max(35, clamped - 1) * 100) / 100,
    max: Math.round(Math.min(99.95, clamped + 1) * 100) / 100,
  };
}

export function calculateChance(
  studentPercentage: number,
  previousCutoff: number
): ChanceLevel {
  const diff = studentPercentage - previousCutoff;

  if (diff >= 2) return "High";
  if (diff >= -2) return "Medium";
  return "Low";
}

function buildRecommendation(
  chance: ChanceLevel,
  collegeName: string,
  branchName: string
): string {
  if (chance === "High") {
    return `Your percentage is above last year's cutoff for ${branchName} at ${collegeName}. This is a safer option for your CAP list.`;
  }

  if (chance === "Medium") {
    return `Your percentage is close to last year's cutoff for ${branchName} at ${collegeName}. This is a realistic target option.`;
  }

  return `Last year's cutoff for ${branchName} at ${collegeName} was higher than your percentage. Keep this as a dream option.`;
}

export function predictColleges(input: PredictionInput): PredictionResult[] {
  const colleges = getColleges();
  const branches = getBranches();
  const results: PredictionResult[] = [];
  const categoryToUse = normalizeCategory(input);
  const selectedBranchIds = getBranchGroupIds(input.branch);

  for (const college of colleges) {
    if (college.status !== "active") continue;

    if (input.city !== "any" && !isInRegion(college, input.city)) {
      continue;
    }

    if (input.collegeType !== "Any" && college.type !== input.collegeType) {
      continue;
    }

    const branchIdsToCheck = college.branchIds.filter((id) =>
      selectedBranchIds.includes(id)
    );

    for (const branchId of branchIdsToCheck) {
      const branch = branches.find((b) => b.id === branchId);

      if (!branch) continue;

      const cutoff =
        getCutoff(college.id, branchId, categoryToUse) ??
        getCutoff(college.id, branchId, input.category) ??
        getCutoff(college.id, branchId, "GOPEN");

      if (!cutoff) continue;

      const fee = getFee(college.id);
      const placement = getPlacement(college.id, branchId);
      const city = getCityById(college.cityId);

      const tuitionFee = fee?.tuition_fee ?? 0;
      const hostelFee = fee?.hostel_fee ?? 0;
      const otherFee = fee?.other_fee ?? 0;
      const totalFee = tuitionFee + hostelFee + otherFee;
      const averagePackage = placement?.average_package ?? 0;

      const expectedCutoff = calculateExpectedCutoff(
        college,
        branchId,
        cutoff.cutoff_percentage
      );

      const chance = calculateChance(input.percentage, cutoff.cutoff_percentage);

      const qualityScore = calculateCollegeQualityScore(
        college,
        cutoff.cutoff_percentage,
        averagePackage,
        branch.demandTier
      );

      results.push({
        collegeId: college.id,
        collegeName: college.name,
        shortName: college.shortName,
        cityId: college.cityId,
        cityName: city?.name ?? college.address ?? college.cityId,
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        collegeType: college.type,
        previousCutoff: cutoff.cutoff_percentage,
        isCutoffVerified: cutoff.isRealData === true,
        expectedCutoff,
        chance,
        qualityRank: 0,
        qualityScore,
        averagePackage,
        highestPackage: placement?.highest_package ?? 0,
        placementPercentage: placement?.placement_percentage ?? 0,
        tuitionFee,
        hostelFee,
        totalFee,
        hostelAvailable: college.hostel,
        recommendation: buildRecommendation(
          chance,
          college.shortName,
          branch.name
        ),
      });
    }
  }

  results.sort((a, b) => {
  const collegeA = colleges.find((c) => c.id === a.collegeId);
  const collegeB = colleges.find((c) => c.id === b.collegeId);

  const reputationA = collegeA ? getManualCollegeScore(collegeA) : 0;
  const reputationB = collegeB ? getManualCollegeScore(collegeB) : 0;

  // 1. Real college reputation priority
  if (reputationA !== reputationB) {
    return reputationB - reputationA;
  }

  // 2. Overall quality score
  if (b.qualityScore !== a.qualityScore) {
    return b.qualityScore - a.qualityScore;
  }

  // 3. Better average package
  if (b.averagePackage !== a.averagePackage) {
    return b.averagePackage - a.averagePackage;
  }

  // 4. Closest cutoff to student's percentage
  return (
    Math.abs(input.percentage - a.previousCutoff) -
    Math.abs(input.percentage - b.previousCutoff)
  );
});

  const collegeRankMap = new Map<string, number>();
  let nextRank = 1;

  return results.map((result) => {
    if (!collegeRankMap.has(result.collegeId)) {
      collegeRankMap.set(result.collegeId, nextRank);
      nextRank += 1;
    }

    return {
      ...result,
      qualityRank: collegeRankMap.get(result.collegeId) ?? nextRank,
    };
  });
}