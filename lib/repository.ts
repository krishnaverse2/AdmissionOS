import "server-only";
import citiesData from "@/lib/data/cities.json";
import categoriesData from "@/lib/data/categories.json";
import branchesData from "@/lib/data/branches.json";
import collegesData from "@/lib/data/colleges.json";
import cutoffsData from "@/lib/data/cutoffs.json";
import placementsData from "@/lib/data/placements.json";
import feesData from "@/lib/data/fees.json";
import type {
  City,
  Category,
  Branch,
  College,
  Cutoff,
  Placement,
  Fee,
} from "@/lib/types";

// This module is the single seam between the app and its data source.
// Right now it reads bundled JSON (acting as the seed tables described
// in the spec). To move to MySQL: replace each function body with a
// query against the corresponding table (colleges, branches, cutoffs,
// placements, fees, cities, categories) and keep the same signatures.

export function getCities(): City[] {
  return citiesData as City[];
}

export function getCategories(): Category[] {
  return categoriesData as Category[];
}

export function getBranches(): Branch[] {
  return branchesData as Branch[];
}

export function getColleges(): College[] {
  return collegesData as College[];
}

export function getCollegeById(id: string): College | undefined {
  return getColleges().find((c) => c.id === id);
}

export function getCutoffs(): Cutoff[] {
  return cutoffsData as Cutoff[];
}

export function getPlacements(): Placement[] {
  return placementsData as Placement[];
}

export function getFees(): Fee[] {
  return feesData as Fee[];
}

export function getCityById(id: string): City | undefined {
  return getCities().find((c) => c.id === id);
}

export function getBranchById(id: string): Branch | undefined {
  return getBranches().find((b) => b.id === id);
}

export function getCategoryById(id: string): Category | undefined {
  return getCategories().find((c) => c.id === id);
}

export function getCutoff(
  collegeId: string,
  branchId: string,
  categoryId: string
): Cutoff | undefined {
  return getCutoffs().find(
    (c) =>
      c.college_id === collegeId &&
      c.branch_id === branchId &&
      c.category_id === categoryId
  );
}

export function getPlacement(
  collegeId: string,
  branchId: string
): Placement | undefined {
  return getPlacements().find(
    (p) => p.college_id === collegeId && p.branch_id === branchId
  );
}

export function getFee(collegeId: string): Fee | undefined {
  return getFees().find((f) => f.college_id === collegeId);
}
