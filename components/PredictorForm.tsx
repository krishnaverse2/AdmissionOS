"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import categoriesData from "@/lib/data/categories.json";
import branchesData from "@/lib/data/branches.json";
import { saveLastPrediction } from "@/lib/clientStore";
import CityInput from "@/components/CityInput";
import type { PredictionInput, CollegeType } from "@/lib/types";

export default function PredictorForm({
  onPredicted,
}: {
  onPredicted?: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<PredictionInput>({
    studentName: "",
    percentage: 88,
    category: "GOPEN",
    gender: "Other",
    city: "any",
    branch: "any",
    collegeType: "Any",
  });

  function update<K extends keyof PredictionInput>(
    key: K,
    value: PredictionInput[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

 function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setSubmitting(true);

  saveLastPrediction(form);
  sessionStorage.setItem("cgai_predict_input", JSON.stringify(form));

  if (onPredicted) {
    onPredicted();
    return;
  }

  router.push("/results");
}

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-4 shadow-xl shadow-teal-950/10">
      <div className="mb-5 rounded-[1.5rem] bg-gradient-to-br from-teal-600 to-emerald-500 p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-100">
          Predictor
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight">
          Your admission chance starts here
        </h2>
        <p className="mt-2 text-sm text-teal-50">
          Fill basic details and get matching colleges instantly.
        </p>
      </div>

      <div className="space-y-4">
        <Field label="Student name">
          <input
            type="text"
            value={form.studentName ?? ""}
            onChange={(e) => update("studentName", e.target.value)}
            placeholder="Optional"
            className="mobileInput"
          />
        </Field>

        <Field label="Diploma percentage" required>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            required
            value={form.percentage}
            onChange={(e) => update("percentage", Number(e.target.value || 0))}
            className="mobileInput font-mono-figures"
          />
        </Field>

        <Field label="Category" required>
          <select
            required
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="mobileInput"
          >
            {categoriesData.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.id})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Gender">
          <select
            value={form.gender}
            onChange={(e) =>
              update("gender", e.target.value as PredictionInput["gender"])
            }
            className="mobileInput"
          >
            <option value="Other">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </Field>

        <Field label="City preference">
          <CityInput
            value={form.city}
            onChange={(cityId) => update("city", cityId)}
          />
        </Field>

        <Field label="Branch preference">
          <select
            value={form.branch}
            onChange={(e) => update("branch", e.target.value)}
            className="mobileInput"
          >
            <option value="any">Any branch</option>
            {branchesData.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="College type">
          <select
            value={form.collegeType}
            onChange={(e) =>
              update("collegeType", e.target.value as CollegeType)
            }
            className="mobileInput"
          >
            <option value="Any">Any college type</option>
            <option value="Government">Government</option>
            <option value="Private">Private</option>
            <option value="Autonomous">Autonomous</option>
          </select>
        </Field>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-2xl bg-slate-950 px-6 py-4 text-base font-black text-white shadow-xl shadow-slate-950/20 transition active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? "Finding colleges…" : "Predict Colleges →"}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}