import { NextRequest, NextResponse } from "next/server";
import { getSavedColleges } from "@/lib/savedStore";
import {
  getCollegeById,
  getBranchById,
  getPlacement,
} from "@/lib/repository";

const COOKIE_NAME = "cgai_session";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(COOKIE_NAME)?.value;
  if (!sessionId) {
    return NextResponse.json({ saved: [] });
  }

  const records = getSavedColleges(sessionId);
  const enriched = records.map((r) => {
    const college = getCollegeById(r.collegeId);
    const branch = getBranchById(r.branchId);
    const placement = getPlacement(r.collegeId, r.branchId);
    return {
      collegeId: r.collegeId,
      branchId: r.branchId,
      collegeName: college?.shortName ?? r.collegeId,
      branchName: branch?.name ?? r.branchId,
      averagePackage: placement?.average_package ?? null,
      savedAt: r.savedAt,
    };
  });

  return NextResponse.json({ saved: enriched });
}
