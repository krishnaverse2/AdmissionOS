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

function seatAvailabilityAdjustment(college: College): number {
  const seatProxy = college.branchIds.length;
  return seatProxy >= 7 ? 0.8 : seatProxy >= 5 ? 0.4 : 0;
}

function normalizeCategory(input: PredictionInput): string {
  const category = input.category;

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

    return femaleMap[category] ?? category;
  }

  return category;
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

  for (const college of colleges) {
    if (college.status !== "active") continue;
    const MUMBAI_REGION = [
  "mumbai",
  "navi-mumbai",
  "thane",
  "andheri",
  "borivali",
  "bandra",
  "dadar",
  "panvel",
  "kharghar",
  "vasai",
  "virar",
  "kalyan",
  "dombivli",
  "bhiwandi",
  "ulhasnagar",
  "ambernath",
  "badlapur",
  "airoli",
  "nerul",
  "vashi",
  "belapur",
];

if (input.city !== "any") {
  if (input.city === "mumbai") {
    if (!MUMBAI_REGION.includes(college.cityId)) continue;
  } else if (college.cityId !== input.city) {
    continue;
  }
}

    if (input.collegeType !== "Any" && college.type !== input.collegeType) {
      continue;
    }

    const branchIdsToCheck =
      input.branch === "any" ? college.branchIds : [input.branch];

    for (const branchId of branchIdsToCheck) {
      if (!college.branchIds.includes(branchId)) continue;

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

      const expectedCutoff = calculateExpectedCutoff(
        college,
        branchId,
        cutoff.cutoff_percentage
      );

      const chance = calculateChance(input.percentage, cutoff.cutoff_percentage);

      results.push({
        collegeId: college.id,
        collegeName: college.name,
        shortName: college.shortName,
        cityId: college.cityId,
        cityName: city?.name ?? college.cityId,
        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,
        collegeType: college.type,
        previousCutoff: cutoff.cutoff_percentage,
        isCutoffVerified: cutoff.isRealData === true,
        expectedCutoff,
        chance,
        averagePackage: placement?.average_package ?? 0,
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

  const chanceWeight: Record<ChanceLevel, number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  results.sort((a, b) => {
    const chanceDiff = chanceWeight[b.chance] - chanceWeight[a.chance];
    if (chanceDiff !== 0) return chanceDiff;

    return Math.abs(input.percentage - a.previousCutoff) -
      Math.abs(input.percentage - b.previousCutoff);
  });

  return results;
}