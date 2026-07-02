import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveCollege, unsaveCollege } from "@/lib/savedStore";

const COOKIE_NAME = "cgai_session";

function getOrCreateSessionId(req: NextRequest): {
  sessionId: string;
  isNew: boolean;
} {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (existing) return { sessionId: existing, isNew: false };
  return { sessionId: randomUUID(), isNew: true };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { collegeId, branchId, action } = body as {
    collegeId: string;
    branchId: string;
    action?: "save" | "unsave";
  };

  if (!collegeId || !branchId) {
    return NextResponse.json(
      { error: "collegeId and branchId are required." },
      { status: 400 }
    );
  }

  const { sessionId, isNew } = getOrCreateSessionId(req);

  const records =
    action === "unsave"
      ? unsaveCollege(sessionId, collegeId, branchId)
      : saveCollege(sessionId, collegeId, branchId);

  const res = NextResponse.json({ saved: records });
  if (isNew) {
    res.cookies.set(COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
