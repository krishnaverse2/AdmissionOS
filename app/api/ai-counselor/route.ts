import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { answerCounselorQuestion } from "@/lib/aiCounselor";
import { predictColleges } from "@/lib/prediction";
import type { PredictionInput } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    return `${index + 1}. ${r.collegeName} | ${r.branchName} | Chance: ${
      r.chance
    } | Last cutoff: ${r.previousCutoff}% | Expected: ${
      r.expectedCutoff.min
    }-${r.expectedCutoff.max}% | Avg package: ₹${
      r.averagePackage || "N/A"
    } LPA | Highest: ₹${r.highestPackage || "N/A"} LPA | Fee: ₹${
      r.totalFee ? r.totalFee.toLocaleString("en-IN") : "N/A"
    }`;
  });

  return `Student predictor input:
${JSON.stringify(lastPrediction, null, 2)}

Top matching colleges from AdmissionOS:
${collegeLines.join("\n")}`;
}

function convertMessages(messages: ChatMessage[]) {
  return messages.slice(-12).map((m) => ({
    role: m.role,
    content: m.text,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const message: string = body.message ?? "";
    const messages: ChatMessage[] = Array.isArray(body.messages)
      ? body.messages
      : [];
    const lastPrediction: PredictionInput | undefined = body.lastPrediction;

    if (!message.trim()) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      const fallback = answerCounselorQuestion(message, { lastPrediction });

      return NextResponse.json({
        answer:
          fallback.answer +
          "\n\nOpenAI API key is missing, so this answer used the offline AdmissionOS counselor engine.",
        usedData: fallback.usedData,
      });
    }

    const predictionContext = buildPredictionContext(lastPrediction);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: `You are AdmissionOS AI Counselor, a helpful Indian engineering admission counselor for Maharashtra DSE / Diploma to Degree students.

Your job:
- Answer like ChatGPT: natural, direct, helpful, conversational.
- Understand follow-up questions using chat history.
- Use the student's predictor data when available.
- Give practical advice on colleges, branches, cutoffs, packages, fees, CAP rounds, and preference list.
- Prefer Maharashtra DSE context.
- Be honest when data is missing.
- Do not invent official placement/cutoff data.
- If package data is estimated or unavailable, say clearly.
- Keep answers easy to understand for a student.
- Use short paragraphs and bullets.
- If user asks in Hinglish/simple English, reply in simple English/Hinglish style.

Important:
Final admission depends on official CAP rounds, seat availability, category reservation rules, and CET Cell updates.`,
        },
        {
          role: "system",
          content: `AdmissionOS data context:\n${predictionContext}`,
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
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to answer question." },
      { status: 500 }
    );
  }
}