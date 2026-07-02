import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCollegeById,
  getCityById,
  getBranches,
  getCutoffs,
  getPlacement,
  getFee,
  getCategories,
} from "@/lib/repository";

export default async function CollegeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const college = getCollegeById(id);
  if (!college) notFound();

  const city = getCityById(college.cityId);
  const branches = getBranches().filter((b) => college.branchIds.includes(b.id));
  const cutoffs = getCutoffs().filter((c) => c.college_id === id);
  const fee = getFee(id);
  const categories = getCategories();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/results"
        className="mb-4 inline-block text-sm font-medium text-indigo hover:underline"
      >
        ← Back to results
      </Link>

      <div className="rounded-xl border border-line bg-white p-6 sm:p-8">
        <p className="font-mono-figures text-xs font-semibold uppercase tracking-widest text-indigo">
          {college.type} · {city?.name}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
          {college.name}
        </h1>
        <p className="mt-1 text-sm text-ink/60">{college.address}</p>
        <a
          href={college.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-indigo hover:underline"
        >
          {college.website} ↗
        </a>

        <div className="mt-6 grid grid-cols-2 gap-4 border-y border-line py-4 sm:grid-cols-4">
          <Stat label="Hostel" value={college.hostel ? "Available" : "Not available"} />
          <Stat
            label="Tuition fee / yr"
            value={fee ? `₹${fee.tuition_fee.toLocaleString("en-IN")}` : "—"}
          />
          <Stat
            label="Hostel fee / yr"
            value={fee ? `₹${fee.hostel_fee.toLocaleString("en-IN")}` : "—"}
          />
          <Stat
            label="Total / yr"
            value={
              fee
                ? `₹${(fee.tuition_fee + fee.hostel_fee + fee.other_fee).toLocaleString("en-IN")}`
                : "—"
            }
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-chance-high">
              Pros
            </h3>
            <ul className="space-y-1.5 text-sm text-ink/75">
              {college.pros.map((p, i) => (
                <li key={i}>+ {p}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-chance-low">
              Cons
            </h3>
            <ul className="space-y-1.5 text-sm text-ink/75">
              {college.cons.map((c, i) => (
                <li key={i}>− {c}</li>
              ))}
            </ul>
          </div>
        </div>

        {college.dataSource && (
          <p className="mt-6 rounded-md border border-line bg-paper-dim px-3 py-2 text-xs leading-relaxed text-ink/55">
            <span className="font-semibold text-ink/70">Data note: </span>
            {college.dataSource}
          </p>
        )}
      </div>

      <h2 className="mt-8 font-display text-xl font-bold text-ink">
        Branches & cutoffs (2025, Round 2)
      </h2>
      <div className="mt-3 space-y-6">
        {branches.map((branch) => {
          const branchCutoffs = cutoffs.filter((c) => c.branch_id === branch.id);
          const placement = getPlacement(id, branch.id);
          return (
            <div
              key={branch.id}
              className="rounded-lg border border-line bg-white p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display font-semibold text-ink">
                  {branch.name} ({branch.code})
                </h3>
                {placement && (
                  <p className="font-mono-figures text-sm text-ink/60">
                    {placement.placement_percentage}% placed · avg ₹
                    {placement.average_package} LPA · highest ₹
                    {placement.highest_package} LPA
                  </p>
                )}
              </div>
              {placement && placement.top_recruiters.length > 0 && (
                <p className="mt-1 text-xs text-ink/50">
                  Top recruiters: {placement.top_recruiters.join(", ")}
                </p>
              )}

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-wide text-ink/45">
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Cutoff %</th>
                      <th className="py-2 pr-4">Cutoff rank</th>
                      <th className="py-2">Source</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-figures">
                    {categories.map((cat) => {
                      const c = branchCutoffs.find((bc) => bc.category_id === cat.id);
                      return (
                        <tr key={cat.id} className="border-b border-line/60">
                          <td className="py-1.5 pr-4 font-sans">{cat.name}</td>
                          <td className="py-1.5 pr-4">
                            {c ? `${c.cutoff_percentage}%` : "—"}
                          </td>
                          <td className="py-1.5 pr-4">{c ? c.cutoff_rank : "—"}</td>
                          <td className="py-1.5 font-sans">
                            {c?.isRealData ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-chance-high-bg px-2 py-0.5 text-[11px] font-semibold text-chance-high">
                                Verified, DTE 2025-26
                              </span>
                            ) : c ? (
                              <span className="text-[11px] text-ink/40">
                                Estimated
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {branchCutoffs.some((c) => c.isRealData) && (
                <p className="mt-2 text-[11px] leading-relaxed text-ink/45">
                  &ldquo;Verified&rdquo; rows are transcribed from the
                  official DTE CAP Round II 2025-26 cutoff PDF. Rows
                  without a published general-category cutoff this round
                  (common when Round I already filled those seats) stay
                  estimated.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-ink/45">
        This prediction is based on previous cutoff data and available
        college information. Final admission depends on official CAP
        rounds, seat availability, category reservation rules, and
        DTE/CET Cell updates.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink/45">{label}</p>
      <p className="font-mono-figures text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
