"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    localStorage.setItem("admissionos_user_name", name.trim());
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-5">
      <form
        onSubmit={handleStart}
        className="w-full rounded-[28px] bg-white p-6 shadow-xl shadow-slate-200 ring-1 ring-slate-100"
      >
        <div className="text-center">
          <div className="text-6xl">🎓</div>
          <h1 className="mt-4 text-3xl font-black text-slate-950">
            Welcome to Admission<span className="text-teal-600">OS</span>
          </h1>
          <p className="mt-3 text-base font-medium text-slate-500">
            Enter your name to personalize your admission dashboard.
          </p>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="mt-8 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-lg font-bold outline-none focus:border-teal-600"
        />

        <button className="mt-5 h-14 w-full rounded-2xl bg-teal-600 text-lg font-black text-white">
          Continue →
        </button>
      </form>
    </div>
  );
}