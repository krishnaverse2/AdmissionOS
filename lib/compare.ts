import "server-only";
import {
  getCollegeById,
  getBranches,
  getCutoff,
  getPlacement,
  getFee,
  getCityById,
} from "@/lib/repository";

export interface ComparisonRow {
  collegeId: string;
  collegeName: string;
  shortName: string;
  cityName: string;
  collegeType: string;
  hostelAvailable: boolean;
  branches: {
    branchId: string;
    branchName: string;
    cutoff: number | null;
    placementPercentage: number | null;
    averagePackage: number | null;
    highestPackage: number | null;
  }[];
  tuitionFee: number;
  hostelFee: number;
  totalFee: number;
  bestAveragePackage: number;
  bestHighestPackage: number;
}

export function compareColleges(
  collegeIds: string[],
  categoryId: string
): { rows: ComparisonRow[]; recommendation: string } {
  const branches = getBranches();
  const rows: ComparisonRow[] = [];

  for (const id of collegeIds) {
    const college = getCollegeById(id);
    if (!college) continue;
    const fee = getFee(id);
    const city = getCityById(college.cityId);

    const branchRows = college.branchIds
      .map((branchId) => {
        const branch = branches.find((b) => b.id === branchId);
        if (!branch) return null;
        const cutoff = getCutoff(id, branchId, categoryId);
        const placement = getPlacement(id, branchId);
        return {
          branchId,
          branchName: branch.name,
          cutoff: cutoff?.cutoff_percentage ?? null,
          placementPercentage: placement?.placement_percentage ?? null,
          averagePackage: placement?.average_package ?? null,
          highestPackage: placement?.highest_package ?? null,
        };
      })
      .filter(Boolean) as ComparisonRow["branches"];

    const bestAvg = Math.max(
      0,
      ...branchRows.map((b) => b.averagePackage ?? 0)
    );
    const bestHighest = Math.max(
      0,
      ...branchRows.map((b) => b.highestPackage ?? 0)
    );

    rows.push({
      collegeId: id,
      collegeName: college.name,
      shortName: college.shortName,
      cityName: city?.name ?? college.cityId,
      collegeType: college.type,
      hostelAvailable: college.hostel,
      branches: branchRows,
      tuitionFee: fee?.tuition_fee ?? 0,
      hostelFee: fee?.hostel_fee ?? 0,
      totalFee: (fee?.tuition_fee ?? 0) + (fee?.hostel_fee ?? 0) + (fee?.other_fee ?? 0),
      bestAveragePackage: bestAvg,
      bestHighestPackage: bestHighest,
    });
  }

  if (rows.length === 0) {
    return { rows, recommendation: "No valid colleges selected to compare." };
  }

  const best = rows.reduce((a, b) =>
    b.bestAveragePackage > a.bestAveragePackage ? b : a
  );
  const cheapest = rows.reduce((a, b) => (b.totalFee < a.totalFee ? b : a));

  let recommendation = `${best.shortName} has the strongest average package among the colleges compared (₹${best.bestAveragePackage} LPA).`;
  if (cheapest.collegeId !== best.collegeId) {
    recommendation += ` ${cheapest.shortName} is the most budget-friendly option (total annual cost ₹${cheapest.totalFee.toLocaleString(
      "en-IN"
    )}).`;
  }
  recommendation +=
    " Weigh this against your own priority between placement strength, fees, and city preference — there's no single right answer.";

  return { rows, recommendation };
}
