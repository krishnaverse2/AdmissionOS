import { NextRequest, NextResponse } from "next/server";
import {
  getCollegeById,
  getCityById,
  getBranches,
  getCutoffs,
  getPlacement,
  getFee,
} from "@/lib/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const college = getCollegeById(id);

  if (!college) {
    return NextResponse.json({ error: "College not found." }, { status: 404 });
  }

  const branches = getBranches().filter((b) =>
    college.branchIds.includes(b.id)
  );
  const cutoffs = getCutoffs().filter((c) => c.college_id === id);
  const fee = getFee(id);
  const city = getCityById(college.cityId);

  const branchDetails = branches.map((b) => ({
    branchId: b.id,
    branchName: b.name,
    branchCode: b.code,
    cutoffsByCategory: cutoffs
      .filter((c) => c.branch_id === b.id)
      .map((c) => ({
        category: c.category_id,
        year: c.year,
        round: c.round,
        cutoff_percentage: c.cutoff_percentage,
        cutoff_rank: c.cutoff_rank,
      })),
    placement: getPlacement(id, b.id) ?? null,
  }));

  return NextResponse.json({
    id: college.id,
    name: college.name,
    shortName: college.shortName,
    city: city?.name ?? college.cityId,
    address: college.address,
    website: college.website,
    type: college.type,
    hostel: college.hostel,
    pros: college.pros,
    cons: college.cons,
    fees: fee
      ? {
          tuition_fee: fee.tuition_fee,
          hostel_fee: fee.hostel_fee,
          other_fee: fee.other_fee,
          total: fee.tuition_fee + fee.hostel_fee + fee.other_fee,
        }
      : null,
    branches: branchDetails,
  });
}
