import { NextRequest, NextResponse } from "next/server";
import { compareColleges } from "@/lib/compare";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const collegeIds: string[] = body.collegeIds ?? [];
    const categoryId: string = body.category ?? "OPEN";

    if (
      !Array.isArray(collegeIds) ||
      collegeIds.length < 2 ||
      collegeIds.length > 3
    ) {
      return NextResponse.json(
        { error: "Provide 2 or 3 college IDs to compare." },
        { status: 400 }
      );
    }

    const result = compareColleges(collegeIds, categoryId);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to compare colleges." },
      { status: 500 }
    );
  }
}
