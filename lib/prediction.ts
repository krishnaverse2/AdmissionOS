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

const MUMBAI_REGION = ["mumbai", "navi-mumbai", "kharghar-navi-mumbai"];

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

function calculateCollegeQualityScore(
  college: College,
  previousCutoff: number,
  averagePackage: number,
  branchDemandTier: "high" | "medium" | "low"
): number {
  let score = 0;

  score += previousCutoff * 0.55;

  if (college.type === "Government") score += 12;
  else if (college.type === "Autonomous") score += 9;
  else score += 4;

  if (averagePackage > 0) score += Math.min(averagePackage, 20) * 1.2;

  if (branchDemandTier === "high") score += 8;
  else if (branchDemandTier === "medium") score += 4;
  else score += 1;

  if (college.branchIds.length >= 7) score += 4;
  else if (college.branchIds.length >= 5) score += 2;

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

    if (input.city !== "any") {
      if (input.city === "mumbai") {
        if (
          !MUMBAI_REGION.includes(college.cityId) &&
          !college.name.toLowerCase().includes("mumbai")
        ) {
          continue;
        }
      } else if (college.cityId !== input.city) {
        continue;
      }
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
        cityName: city?.name ?? college.cityId,
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
    if (b.qualityScore !== a.qualityScore) {
      return b.qualityScore - a.qualityScore;
    }

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