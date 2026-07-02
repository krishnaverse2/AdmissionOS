import { NextRequest, NextResponse } from "next/server";
import { predictColleges } from "@/lib/prediction";
import type { PredictionInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<PredictionInput>;

    if (
      typeof body.percentage !== "number" ||
      !body.category ||
      !body.city ||
      !body.branch ||
      !body.collegeType
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const input: PredictionInput = {
      studentName: body.studentName,
      percentage: body.percentage,
      category: body.category,
      gender: body.gender,
      city: body.city,
      branch: body.branch,
      collegeType: body.collegeType,
    };

    const results = predictColleges(input);

    return NextResponse.json({
      count: results.length,
      results,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to predict colleges." },
      { status: 500 }
    );
  }
}