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

const MUMBAI_REGION = [
  "mumbai",
  "navi-mumbai",
  "kharghar-navi-mumbai",
];

/*
|--------------------------------------------------------------------------
| Maharashtra College Priority
|--------------------------------------------------------------------------
| Lower number = better priority.
| This is used before package/cutoff scoring.
*/
const COLLEGE_FIXED_RANK: Record<string, number> = {
  "6006": 1, // COEP
  "3012": 2, // VJTI
  "6271": 3, // PICT
  "3197": 4, // SPIT
  "3199": 5, // DJ Sanghvi
  "6007": 6, // Walchand Sangli
  "6273": 7, // VIT Pune
  "3014": 8, // SPCE
  "3182": 9, // Thadomal
  "3184": 10, // Fr. CRCE
  "3185": 11, // VESIT
  "6272": 12, // DYP Akurdi
  "6822": 13, // PCCOER Ravet
  "6274": 14, // PVG Pune
  "6005": 15, // Govt Karad
  "5004": 16, // Govt Jalgaon
  "4115": 17, // Govt Nagpur
  "1002": 18, // Govt Amravati
  "2008": 19, // Govt Sambhajinagar
};

function getFixedCollegeRank(collegeId: string): number {
  return COLLEGE_FIXED_RANK[collegeId] ?? 9999;
}

function getBranchGroupIds(selectedBranch: string): string[] {
  const branches = getBranches();

  if (selectedBranch === "any") {
    return branches.map((b) => b.id);
  }

  const isComputer = (name: string) =>
    /computer|information technology|artificial intelligence|machine learning|data science|cyber|iot|software|block chain|internet of things/i.test(
      name
    );

  const isElectronics = (name: string) =>
    /electronics|telecommunication|communication|vlsi|instrumentation|5g/i.test(
      name
    );

  const isElectrical = (name: string) =>
    /electrical|power/i.test(name);

  const isMechanical = (name: string) =>
    /mechanical|mechatronics|automobile|production/i.test(name);

  const isCivil = (name: string) =>
    /civil|infrastructure|structural|environmental/i.test(name);

  const isRobotics = (name: string) =>
    /robotics|automation/i.test(name);

  const isChemical = (name: string) =>
    /chemical|petro|food|paint|oil|plastic|polymer|pharmaceutical/i.test(
      name
    );

  const groupMap: Record<string, (name: string) => boolean> = {
    "group-computer": isComputer,
    "group-electronics": isElectronics,
    "group-electrical": isElectrical,
    "group-mechanical": isMechanical,
    "group-civil": isCivil,
    "group-robotics": isRobotics,
    "group-chemical": isChemical,

    "group-other": (name: string) =>
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

    if (!matcher) {
      return [];
    }

    return branches
      .filter((b) => matcher(b.name))
      .map((b) => b.id);
  }

  return [selectedBranch];
}

function seatAvailabilityAdjustment(college: College): number {
  const seatProxy = college.branchIds.length;

  if (seatProxy >= 7) return 0.8;
  if (seatProxy >= 5) return 0.4;

  return 0;
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

  // Cutoff strength
  score += previousCutoff * 0.55;

  // College type
  if (college.type === "Government") {
    score += 12;
  } else if (college.type === "Autonomous") {
    score += 9;
  } else {
    score += 4;
  }

  // Placement strength
  if (averagePackage > 0) {
    score += Math.min(averagePackage, 20) * 1.2;
  }

  // Branch demand
  if (branchDemandTier === "high") {
    score += 8;
  } else if (branchDemandTier === "medium") {
    score += 4;
  } else {
    score += 1;
  }

  // Branch availability proxy
  if (college.branchIds.length >= 7) {
    score += 4;
  } else if (college.branchIds.length >= 5) {
    score += 2;
  }

  return Math.round(score * 100) / 100;
}

export function calculateExpectedCutoff(
  college: College,
  branchId: string,
  previousCutoff: number
): ExpectedCutoffRange {
  const branch = getBranchById(branchId);

  const branchAdj = branch
    ? BRANCH_DEMAND_ADJUSTMENT[branch.demandTier]
    : 0;

  const seatAdj = seatAvailabilityAdjustment(college);

  const expected =
    previousCutoff +
    branchAdj -
    seatAdj;

  const clamped = Math.max(
    35,
    Math.min(99.95, expected)
  );

  return {
    point: Math.round(clamped * 100) / 100,

    min:
      Math.round(
        Math.max(35, clamped - 1) * 100
      ) / 100,

    max:
      Math.round(
        Math.min(99.95, clamped + 1) * 100
      ) / 100,
  };
}

export function calculateChance(
  studentPercentage: number,
  previousCutoff: number
): ChanceLevel {
  const diff =
    studentPercentage -
    previousCutoff;

  if (diff >= 2) {
    return "High";
  }

  if (diff >= -2) {
    return "Medium";
  }

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

export function predictColleges(
  input: PredictionInput
): PredictionResult[] {
  const colleges = getColleges();
  const branches = getBranches();

  const results: PredictionResult[] = [];

  const categoryToUse =
    normalizeCategory(input);

  const selectedBranchIds =
    getBranchGroupIds(input.branch);

  for (const college of colleges) {
    if (college.status !== "active") {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | City Filter
    |--------------------------------------------------------------------------
    */
    if (input.city !== "any") {
      if (input.city === "mumbai") {
        const collegeName =
          college.name.toLowerCase();

        if (
          !MUMBAI_REGION.includes(college.cityId) &&
          !collegeName.includes("mumbai")
        ) {
          continue;
        }
      } else if (college.cityId !== input.city) {
        continue;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | College Type Filter
    |--------------------------------------------------------------------------
    */
    if (
      input.collegeType !== "Any" &&
      college.type !== input.collegeType
    ) {
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Branch Filter
    |--------------------------------------------------------------------------
    */
    const branchIdsToCheck =
      college.branchIds.filter((id) =>
        selectedBranchIds.includes(id)
      );

    for (const branchId of branchIdsToCheck) {
      const branch =
        branches.find(
          (b) => b.id === branchId
        );

      if (!branch) {
        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | Cutoff Lookup
      |--------------------------------------------------------------------------
      */
      const cutoff =
        getCutoff(
          college.id,
          branchId,
          categoryToUse
        ) ??
        getCutoff(
          college.id,
          branchId,
          input.category
        ) ??
        getCutoff(
          college.id,
          branchId,
          "GOPEN"
        );

      if (!cutoff) {
        continue;
      }

      const fee =
        getFee(college.id);

      const placement =
        getPlacement(
          college.id,
          branchId
        );

      const city =
        getCityById(college.cityId);

      const tuitionFee =
        fee?.tuition_fee ?? 0;

      const hostelFee =
        fee?.hostel_fee ?? 0;

      const otherFee =
        fee?.other_fee ?? 0;

      const totalFee =
        tuitionFee +
        hostelFee +
        otherFee;

      const averagePackage =
        placement?.average_package ?? 0;

      const expectedCutoff =
        calculateExpectedCutoff(
          college,
          branchId,
          cutoff.cutoff_percentage
        );

      const chance =
        calculateChance(
          input.percentage,
          cutoff.cutoff_percentage
        );

      const qualityScore =
        calculateCollegeQualityScore(
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
        cityName:
          city?.name ??
          college.cityId,

        branchId: branch.id,
        branchName: branch.name,
        branchCode: branch.code,

        collegeType: college.type,

        previousCutoff:
          cutoff.cutoff_percentage,

        isCutoffVerified:
          cutoff.isRealData === true,

        expectedCutoff,
        chance,

        qualityRank: 0,
        qualityScore,

        averagePackage,

        highestPackage:
          placement?.highest_package ?? 0,

        placementPercentage:
          placement?.placement_percentage ?? 0,

        tuitionFee,
        hostelFee,
        totalFee,

        hostelAvailable:
          college.hostel,

        recommendation:
          buildRecommendation(
            chance,
            college.shortName,
            branch.name
          ),
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Correct Sorting
  |--------------------------------------------------------------------------
  | 1. Fixed Maharashtra college rank
  | 2. Average package
  | 3. Previous cutoff
  | 4. Quality score
  | 5. Closest cutoff to student marks
  */
  results.sort(
    (
      a: PredictionResult,
      b: PredictionResult
    ) => {
      const rankA =
        getFixedCollegeRank(a.collegeId);

      const rankB =
        getFixedCollegeRank(b.collegeId);

      // Fixed college ranking first
      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Better package
      if (
        b.averagePackage !==
        a.averagePackage
      ) {
        return (
          b.averagePackage -
          a.averagePackage
        );
      }

      // Higher cutoff / demand
      if (
        b.previousCutoff !==
        a.previousCutoff
      ) {
        return (
          b.previousCutoff -
          a.previousCutoff
        );
      }

      // Better quality
      if (
        b.qualityScore !==
        a.qualityScore
      ) {
        return (
          b.qualityScore -
          a.qualityScore
        );
      }

      // Closest cutoff
      return (
        Math.abs(
          input.percentage -
            a.previousCutoff
        ) -
        Math.abs(
          input.percentage -
            b.previousCutoff
        )
      );
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Assign Display Rank
  |--------------------------------------------------------------------------
  */
  const collegeRankMap =
    new Map<string, number>();

  let nextRank = 1;

  return results.map(
    (
      result: PredictionResult
    ): PredictionResult => {
      if (
        !collegeRankMap.has(
          result.collegeId
        )
      ) {
        collegeRankMap.set(
          result.collegeId,
          nextRank
        );

        nextRank += 1;
      }

      return {
        ...result,

        qualityRank:
          collegeRankMap.get(
            result.collegeId
          ) ?? nextRank,
      };
    }
  );
}