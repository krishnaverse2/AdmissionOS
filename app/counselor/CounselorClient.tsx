"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getLastPrediction } from "@/lib/clientStore";
import type { PredictionInput } from "@/lib/types";
import Loader from "@/components/Loader";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Which college is best for my marks?",
  "Should I choose CO or IT?",
  "Is VIT Pune good for placement?",
  "Should I wait for next CAP round?",
  "Make my preference list",
];

export default function CounselorClient() {
  const [mounted, setMounted] = useState(false);
  const [lastPrediction, setLastPrediction] = useState<PredictionInput | null>(
    null
  );

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi, I'm your CAP counselor. Ask me about colleges, branches, or placements.",
    },
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setLastPrediction(getLastPrediction());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    if (!text.trim() || sending) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai-counselor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, lastPrediction }),
      });

      const data = await res.json();

      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer ?? "Something went wrong." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Something went wrong reaching the counselor. Try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-82px)] items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-82px)] flex-col bg-white">
      <header className="sticky top-0 z-40 bg-white px-5 pb-4 pt-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-black uppercase tracking-[0.2em] text-teal-600">
              AI Counselor
            </p>

            <h1 className="mt-1 text-[25px] font-black leading-tight text-slate-950">
              Ask Admission Doubts
            </h1>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-3xl">
            🤖
          </div>
        </div>

        {!lastPrediction && (
          <p className="mt-3 text-[13px] font-medium leading-5 text-slate-500">
            Tip: fill the{" "}
            <Link href="/" className="font-black text-teal-600 underline">
              predictor form
            </Link>{" "}
            first for personalized answers.
          </p>
        )}
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-[22px] px-4 py-3 text-[15px] font-medium leading-7 shadow-sm ${
                m.role === "user"
                  ? "rounded-br-md bg-teal-600 text-white"
                  : "rounded-bl-md bg-slate-100 text-slate-800"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-[22px] rounded-bl-md bg-slate-100 px-4 py-3 text-[15px] font-bold text-slate-500">
              Checking the data…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-100 bg-white px-5 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-bold text-slate-600 shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-3 border-t border-slate-100 bg-white px-5 pb-5 pt-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about college, branch..."
          className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[15px] font-medium outline-none focus:border-teal-500"
        />

        <button
          type="submit"
          disabled={sending}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-2xl font-black text-white shadow-lg shadow-teal-600/25 disabled:opacity-60"
        >
          ↑
        </button>
      </form>
    </div>
  );
}