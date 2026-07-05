import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { answerCounselorQuestion } from "@/lib/aiCounselor";
import { predictColleges } from "@/lib/prediction";
import type { PredictionInput } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

function buildPredictionContext(lastPrediction?: PredictionInput) {
  if (!lastPrediction) {
    return "No predictor form data is available yet.";
  }

  const results = predictColleges(lastPrediction).slice(0, 12);

  if (results.length === 0) {
    return `Student predictor input:
${JSON.stringify(lastPrediction, null, 2)}

No matching prediction results were found.`;
  }

  const collegeLines = results.map((r, index) => {
    return `${index + 1}. ${r.collegeName}
Branch: ${r.branchName}
Chance: ${r.chance}
Last cutoff: ${r.previousCutoff}%
Expected cutoff: ${r.expectedCutoff.min}-${r.expectedCutoff.max}%
Average package: ₹${r.averagePackage || "N/A"} LPA
Highest package: ₹${r.highestPackage || "N/A"} LPA
Total fee: ₹${
      r.totalFee ? r.totalFee.toLocaleString("en-IN") : "N/A"
    }`;
  });

  return `Student predictor input:
${JSON.stringify(lastPrediction, null, 2)}

Top matching colleges from AdmissionOS:
${collegeLines.join("\n\n")}`;
}

function convertMessages(messages: ChatMessage[]) {
  return messages.slice(-12).map((message) => ({
    role: message.role as "user" | "assistant",
    content: message.text,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const message: string =
      typeof body.message === "string" ? body.message : "";

    const messages: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages
      : [];

    const lastPrediction: PredictionInput | undefined =
      body.lastPrediction ?? undefined;

    if (!message.trim()) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Safe fallback when OpenAI key is missing.
    // Important: OpenAI client is NOT created before this check.
    if (!apiKey) {
      const fallback = answerCounselorQuestion(message, {
        lastPrediction,
      });

      return NextResponse.json({
        answer: fallback.answer,
        usedData: fallback.usedData,
        mode: "offline",
      });
    }

    // Create client only when API key actually exists.
    const client = new OpenAI({
      apiKey,
    });

    const predictionContext =
      buildPredictionContext(lastPrediction);

    const response =
      await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 900,

        messages: [
          {
            role: "system",
            content: `You are AdmissionOS AI Counselor.

You are an intelligent, conversational Maharashtra engineering admission assistant.

Your behavior:
- Answer the exact question the user asks.
- Talk naturally like a helpful AI assistant.
- Understand follow-up questions from conversation history.
- Do not force every answer into a fixed template.
- Give direct answers first.
- Explain when useful.
- Use simple English.
- If the user uses Hinglish, you may answer naturally in simple Hinglish.
- Focus strongly on Maharashtra DSE / Direct Second Year engineering admission.
- Help with colleges, branches, placements, packages, cutoffs, CAP rounds, option forms, fees, city choices, and preference lists.
- Use AdmissionOS predictor context when relevant.
- Never invent official cutoff or placement figures.
- Clearly say when exact data is unavailable.
- Distinguish between verified data, estimates, and general advice.
- Remember previous messages in the current conversation.

Important:
Final admission depends on official CAP rounds, seat availability, category reservation rules, and CET Cell updates.`,
          },

          {
            role: "system",
            content: `AdmissionOS student and prediction context:

${predictionContext}`,
          },

          ...convertMessages(messages),

          {
            role: "user",
            content: message,
          },
        ],
      });

    const answer =
      response.choices[0]?.message?.content?.trim() ||
      "I could not generate an answer right now. Please try again.";

    return NextResponse.json({
      answer,
      usedData: true,
      mode: "openai",
    });
  } catch (error: unknown) {
    console.error("AI Counselor error:", error);

    return NextResponse.json(
      {
        error: "Failed to answer question.",
      },
      { status: 500 }
    );
  }
}