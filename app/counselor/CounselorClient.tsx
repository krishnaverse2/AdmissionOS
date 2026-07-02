"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getLastPrediction } from "@/lib/clientStore";
import type { PredictionInput } from "@/lib/types";

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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi, I'm your CAP counselor. Ask me about a college's placement record, compare two branches, or ask which colleges fit your marks best — I'll only answer from the cutoff, placement, and fee data in CAP Guru AI, and I'll tell you when I don't have something.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastPrediction] = useState<PredictionInput | null>(() =>
    typeof window !== "undefined" ? getLastPrediction() : null
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        { role: "assistant", text: "Something went wrong reaching the counselor. Try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-3xl flex-col px-4 sm:px-6">
      <div className="border-b border-line py-4">
        <p className="font-mono-figures text-xs font-semibold uppercase tracking-widest text-indigo">
          AI Counselor
        </p>
        <h1 className="font-display text-xl font-bold text-ink">
          Ask about colleges, branches, or placements
        </h1>
        {!lastPrediction && (
          <p className="mt-1 text-xs text-ink/50">
            Tip: fill the{" "}
            <Link href="/" className="text-indigo underline">
              predictor form
            </Link>{" "}
            first so I can answer questions about your own marks.
          </p>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-indigo text-paper"
                  : "border border-line bg-white text-ink"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink/50">
              Checking the data…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line py-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/65 hover:border-indigo hover:text-indigo"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-line py-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a college, branch, or placement…"
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-indigo px-5 py-2 text-sm font-semibold text-paper hover:bg-indigo-light disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
