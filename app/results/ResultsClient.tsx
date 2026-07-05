"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import branchesData from "@/lib/data/branches.json";
import ResultCard from "@/components/ResultCard";
import CityInput from "@/components/CityInput";
import Loader from "@/components/Loader";
import type {
  PredictionInput,
  PredictionResult,
  ChanceLevel,
} from "@/lib/types";

interface FilterState {
  city: string;
  branch: string;
  collegeType: string;
  chance: ChanceLevel | "any";
}

const CITY_REGIONS: Record<string, string[]> = {
  pune: [
    "pune",
    "pimpri",
    "chinchwad",
    "pimpri chinchwad",
    "akurdi",
    "ravet",
    "tathawade",
    "hinjawadi",
    "wagholi",
    "hadapsar",
    "narhe",
    "karvenagar",
    "alandi",
    "talegaon",
  ],
  mumbai: [
    "mumbai",
    "navi mumbai",
    "navi-mumbai",
    "kharghar",
    "thane",
    "panvel",
    "kalyan",
    "dombivli",
    "vasai",
    "virar",
  ],
};

export default function ResultsClient() {
  const [input] = useState<PredictionInput | null>(() => {
    if (typeof window === "undefined") return null;

    const raw = sessionStorage.getItem("cgai_predict_input");

    return raw ? JSON.parse(raw) : null;
  });

  const [results, setResults] = useState<PredictionResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    city: "any",
    branch: "any",
    collegeType: "Any",
    chance: "any",
  });

  useEffect(() => {
    if (!input) return;

    fetch("/api/predict-colleges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setResults(data.results);
        }
      })
      .catch(() => {
        setError("Something went wrong while predicting colleges.");
      });
  }, [input]);

  const filtered = useMemo(() => {
    if (!results) return [];

    return results.filter((r) => {
      if (filters.city !== "any") {
        const selectedCity = filters.city
          .toLowerCase()
          .replaceAll("-", " ");

        const regionCities = CITY_REGIONS[selectedCity];

        const collegeText =
          `${r.cityId} ${(r as any).cityName ?? ""} ${r.collegeName}`
            .toLowerCase()
            .replaceAll("-", " ");

        if (regionCities) {
          const matchesRegion = regionCities.some((city) =>
            collegeText.includes(
              city.toLowerCase().replaceAll("-", " ")
            )
          );

          if (!matchesRegion) {
            return false;
          }
        } else {
          if (!collegeText.includes(selectedCity)) {
            return false;
          }
        }
      }

      if (
        filters.branch !== "any" &&
        r.branchId !== filters.branch
      ) {
        return false;
      }

      if (
        filters.collegeType !== "Any" &&
        r.collegeType !== filters.collegeType
      ) {
        return false;
      }

      if (
        filters.chance !== "any" &&
        r.chance !== filters.chance
      ) {
        return false;
      }

      return true;
    });
  }, [results, filters]);

  function toggleCompare(id: string, checked: boolean) {
    setCompareIds((prev) => {
      if (checked) {
        if (prev.length >= 3) {
          return prev;
        }

        return [...prev, id];
      }

      return prev.filter((x) => x !== id);
    });
  }

  if (!input) {
    return (
      <div className="px-5 py-14 text-center">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-teal-950/10">
          <p className="text-xl font-black text-slate-950">
            No search yet
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Fill the predictor form first.
          </p>

          <Link
            href="/"
            className="mt-5 inline-flex rounded-2xl bg-teal-600 px-5 py-3 text-sm font-black text-white"
          >
            Go to Predictor
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-14 text-center">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl">
          <p className="text-sm font-bold text-red-500">
            {error}
          </p>

          <Link
            href="/"
            className="mt-4 inline-block text-sm font-bold text-teal-700"
          >
            Back to predictor
          </Link>
        </div>
      </div>
    );
  }

  /*
   * NEW GLOBAL LOADER
   *
   * While prediction API is loading,
   * show only your custom loader.
   */
  if (results === null) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-5">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-5">
      <section className="rounded-[2rem] bg-white p-5 shadow-xl shadow-teal-950/10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600">
          Prediction Summary
        </p>

        <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950">
          {input.percentage}% · {input.category}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {filtered.length} matching options found
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <MiniStat
            label="High"
            value={
              results.filter((r) => r.chance === "High").length
            }
            tone="green"
          />

          <MiniStat
            label="Target"
            value={
              results.filter((r) => r.chance === "Medium").length
            }
            tone="amber"
          />

          <MiniStat
            label="Dream"
            value={
              results.filter((r) => r.chance === "Low").length
            }
            tone="red"
          />
        </div>
      </section>

      <div className="flex gap-2">
        <button
          onClick={() => setShowFilters(true)}
          className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm ring-1 ring-slate-200"
        >
          🔍 Filters
        </button>

        <Link
          href="/preference-list"
          className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-slate-950/20"
        >
          Preference →
        </Link>
      </div>

      {compareIds.length >= 2 && (
        <Link
          href={`/compare?ids=${compareIds.join(
            ","
          )}&category=${input.category}`}
          className="block rounded-2xl bg-teal-600 px-4 py-3 text-center text-sm font-black text-white"
        >
          Compare {compareIds.length} colleges
        </Link>
      )}

      <section className="space-y-4">
        {filtered.length === 0 && (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl">
            <p className="text-sm text-slate-500">
              No colleges match these filters. Try widening your
              filters.
            </p>
          </div>
        )}

        {filtered.map((r) => (
          <ResultCard
            key={`${r.collegeId}-${r.branchId}`}
            result={r}
            selected={compareIds.includes(r.collegeId)}
            compareDisabled={
              !compareIds.includes(r.collegeId) &&
              compareIds.length >= 3
            }
            onToggleCompare={(checked) =>
              toggleCompare(r.collegeId, checked)
            }
          />
        ))}
      </section>

      {showFilters && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40">
          <div className="w-full max-w-[430px] rounded-t-[2rem] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-950">
                Filters
              </h2>

              <button
                onClick={() => setShowFilters(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  City
                </span>

                <CityInput
                  value={filters.city}
                  onChange={(v) =>
                    setFilters((f) => ({
                      ...f,
                      city: v,
                    }))
                  }
                  placeholder="Any city"
                />
              </label>

              <FilterSelect
                label="Branch"
                value={filters.branch}
                onChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    branch: v,
                  }))
                }
                options={[
                  {
                    value: "any",
                    label: "Any branch",
                  },
                  ...branchesData.map((b) => ({
                    value: b.id,
                    label: b.name,
                  })),
                ]}
              />

              <FilterSelect
                label="College type"
                value={filters.collegeType}
                onChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    collegeType: v,
                  }))
                }
                options={[
                  {
                    value: "Any",
                    label: "Any",
                  },
                  {
                    value: "Government",
                    label: "Government",
                  },
                  {
                    value: "Private",
                    label: "Private",
                  },
                  {
                    value: "Autonomous",
                    label: "Autonomous",
                  },
                ]}
              />

              <FilterSelect
                label="Chance"
                value={filters.chance}
                onChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    chance: v as ChanceLevel | "any",
                  }))
                }
                options={[
                  {
                    value: "any",
                    label: "Any",
                  },
                  {
                    value: "High",
                    label: "High",
                  },
                  {
                    value: "Medium",
                    label: "Medium",
                  },
                  {
                    value: "Low",
                    label: "Low",
                  },
                ]}
              />

              <button
                onClick={() => setShowFilters(false)}
                className="w-full rounded-2xl bg-teal-600 px-5 py-4 text-sm font-black text-white"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "green" | "amber" | "red";
}) {
  const styles = {
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div
      className={`rounded-2xl p-3 text-center ${styles[tone]}`}
    >
      <p className="text-lg font-black">
        {value}
      </p>

      <p className="mt-1 text-[11px] font-black uppercase">
        {label}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mobileInput"
      >
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
          >
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}