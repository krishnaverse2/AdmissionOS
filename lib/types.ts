export type CollegeType = "Government" | "Private" | "Autonomous" | "Any";
export type ChanceLevel = "High" | "Medium" | "Low";
export type PreferenceTier = "Dream" | "Target" | "Safe";

export interface City {
  id: string;
  name: string;
  demandScore: number;
}

export interface Category {
  id: string;
  name: string;
  demandAdjustment: number;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  demandTier: "high" | "medium" | "low";
}

export interface College {
  id: string;
  name: string;
  shortName: string;
  cityId: string;
  address: string;
  website: string;
  type: "Government" | "Private" | "Autonomous";
  status: "active" | "inactive";
  placementScore: number;
  hostel: boolean;
  branchIds: string[];
  pros: string[];
  cons: string[];
  dataSource?: string;
}

export interface Cutoff {
  id: number;
  college_id: string;
  branch_id: string;
  category_id: string;
  year: number;
  round: string;
  cutoff_percentage: number;
  cutoff_rank: number;
  isRealData?: boolean;
  source?: string;
}

export interface Placement {
  id: number;
  college_id: string;
  branch_id: string;
  year: number;
  average_package: number;
  highest_package: number;
  placement_percentage: number;
  top_recruiters: string[];
}

export interface Fee {
  id: number;
  college_id: string;
  year: number;
  tuition_fee: number;
  hostel_fee: number;
  other_fee: number;
}

export interface PredictionInput {
  studentName?: string;
  percentage: number;
  category: string;
  gender?: "Male" | "Female" | "Other";
  city: string;
  branch: string;
  collegeType: CollegeType;
}

export interface ExpectedCutoffRange {
  min: number;
  max: number;
  point: number;
}

export interface PredictionResult {
  collegeId: string;
  collegeName: string;
  shortName: string;
  cityId: string;
  cityName: string;
  branchId: string;
  branchName: string;
  branchCode: string;
  collegeType: string;
  previousCutoff: number;
  isCutoffVerified: boolean;
  expectedCutoff: ExpectedCutoffRange;
  chance: ChanceLevel;
  qualityRank: number;
  qualityScore: number;
  averagePackage: number;
  highestPackage: number;
  placementPercentage: number;
  tuitionFee: number;
  hostelFee: number;
  totalFee: number;
  hostelAvailable: boolean;
  recommendation: string;
}

export interface PreferenceListEntry extends PredictionResult {
  tier: PreferenceTier;
  reason: string;
  rank: number;
}

export interface PreferenceListResult {
  generatedAt: string;
  input: PredictionInput;
  dream: PreferenceListEntry[];
  target: PreferenceListEntry[];
  safe: PreferenceListEntry[];
}