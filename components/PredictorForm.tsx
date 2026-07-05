"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import categoriesData from "@/lib/data/categories.json";
import { saveLastPrediction } from "@/lib/clientStore";
import CityInput from "@/components/CityInput";
import type { PredictionInput } from "@/lib/types";

const FORM_STORAGE_KEY = "admissionos_predictor_form";

const BRANCH_GROUPS = [
  { id: "any", name: "Any branch" },
  { id: "group-computer", name: "Computer / IT / AI / AIDS / Cyber / Data Science" },
  { id: "group-electronics", name: "Electronics / ENTC / VLSI / Communication" },
  { id: "group-electrical", name: "Electrical / Electronics & Power" },
  { id: "group-mechanical", name: "Mechanical / Automation / Mechatronics" },
  { id: "group-civil", name: "Civil / Infrastructure / Structural" },
  { id: "group-robotics", name: "Robotics / Automation / AI Robotics" },
  { id: "group-chemical", name: "Chemical / Petrochemical / Food / Paints" },
  { id: "group-other", name: "Other branches" },
];

export default function PredictorForm({
  onPredicted,
  initialCity = "any",
}: {
  onPredicted?: () => void;
  initialCity?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<PredictionInput>({
    studentName: "",
    percentage: 0,
    category: "GOPEN",
    gender: "Other",
    city: "any",
    branch: "any",
    collegeType: "Any",
  });

  useEffect(() => {
    const savedName = localStorage.getItem("admissionos_user_name") || "";
    const savedFormRaw = localStorage.getItem(FORM_STORAGE_KEY);

    if (savedFormRaw) {
      try {
        const savedForm = JSON.parse(savedFormRaw) as PredictionInput;

        setForm({
          ...savedForm,
          studentName: savedName,
          city: initialCity !== "any" ? initialCity : savedForm.city || "any",
          collegeType: "Any",
        });

        return;
      } catch {
        localStorage.removeItem(FORM_STORAGE_KEY);
      }
    }

    setForm((f) => ({
      ...f,
      studentName: savedName,
      city: initialCity !== "any" ? initialCity : f.city,
    }));
  }, [initialCity]);

  function update<K extends keyof PredictionInput>(
    key: K,
    value: PredictionInput[K]
  ) {
    setForm((f) => {
      const nextForm = { ...f, [key]: value };

      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(nextForm));

      return nextForm;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.percentage || form.percentage <= 0) {
      alert("Please enter your diploma percentage.");
      return;
    }

    if (form.percentage > 100) {
      alert("Diploma percentage cannot be more than 100.");
      return;
    }

    setSubmitting(true);

    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
    saveLastPrediction(form);
    sessionStorage.setItem("cgai_predict_input", JSON.stringify(form));

    if (onPredicted) return onPredicted();
    router.push("/results");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-4 shadow-xl shadow-teal-950/10">
      <div className="mb-5 rounded-[1.5rem] bg-gradient-to-br from-teal-600 to-emerald-500 p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-100">Predictor</p>
        <h2 className="mt-2 text-2xl font-black leading-tight">Your admission chance starts here</h2>
        <p className="mt-2 text-sm leading-relaxed text-teal-50">
          Select a branch group to see all related colleges.
        </p>
      </div>

      <div className="space-y-4">
        <Field label="Student name">
          <input value={form.studentName ?? ""} readOnly placeholder="Your name" className="mobileInput bg-slate-100 text-slate-500" />
        </Field>

        <Field label="Diploma percentage" required>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            required
            value={form.percentage === 0 ? "" : form.percentage}
            onChange={(e) => update("percentage", e.target.value === "" ? 0 : Number(e.target.value))}
            placeholder="Enter your percentage"
            className="mobileInput font-mono-figures"
          />
        </Field>

        <Field label="Category" required>
          <select required value={form.category} onChange={(e) => update("category", e.target.value)} className="mobileInput">
            {categoriesData.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.id})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Gender">
          <select value={form.gender} onChange={(e) => update("gender", e.target.value as PredictionInput["gender"])} className="mobileInput">
            <option value="Other">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </Field>

        <Field label="City preference">
          <CityInput value={form.city} onChange={(cityId) => update("city", cityId)} />
        </Field>

        <Field label="Branch preference">
          <select value={form.branch} onChange={(e) => update("branch", e.target.value)} className="mobileInput">
            {BRANCH_GROUPS.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-2xl bg-slate-950 px-6 py-4 text-base font-black text-white shadow-xl shadow-slate-950/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Finding colleges…" : "Predict Colleges →"}
      </button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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