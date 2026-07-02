import { NextRequest, NextResponse } from "next/server";
import { answerCounselorQuestion } from "@/lib/aiCounselor";
import type { PredictionInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = body.message ?? "";
    const lastPrediction: PredictionInput | undefined = body.lastPrediction;

    if (!message.trim()) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const result = answerCounselorQuestion(message, { lastPrediction });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to answer question." },
      { status: 500 }
    );
  }
}
