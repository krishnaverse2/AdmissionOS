import { NextRequest, NextResponse } from "next/server";
import { getColleges, getCityById, getBranches } from "@/lib/repository";

const MUMBAI_REGION = ["mumbai", "navi-mumbai", "kharghar-navi-mumbai"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const type = searchParams.get("type");

  let colleges = getColleges();

  if (city && city !== "any") {
    if (city === "mumbai") {
      colleges = colleges.filter(
        (c) =>
          MUMBAI_REGION.includes(c.cityId) ||
          c.name.toLowerCase().includes("mumbai")
      );
    } else {
      colleges = colleges.filter((c) => c.cityId === city);
    }
  }

  if (type && type !== "Any") {
    colleges = colleges.filter((c) => c.type === type);
  }

  const branches = getBranches();

  const data = colleges.map((c) => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    city: getCityById(c.cityId)?.name ?? c.cityId,
    type: c.type,
    hostel: c.hostel,
    branches: c.branchIds
      .map((id) => branches.find((b) => b.id === id)?.code)
      .filter(Boolean),
  }));

  return NextResponse.json({ count: data.length, colleges: data });
}