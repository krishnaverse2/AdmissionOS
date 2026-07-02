// Overlays REAL, verbatim cutoff figures transcribed from an official
// DTE/CAP cutoff PDF onto the generated cutoffs.json. Run this AFTER
// generate-cutoffs.js, since it modifies rows generate-cutoffs.js created.
//
// Source (fetched June 2026):
// https://dse2025.mahacet.org.in/dse25/staticFiles/dse_cap2_cut_off_2025_26.pdf
// "Provisional Cutoff List of CAP Round II For Admission to Direct Second
// Year of Full Time Under Graduate Courses in Engineering/Technology for
// AY 2025-26" — State Common Entrance Test Cell, Mumbai.
//
// IMPORTANT — what this data actually is:
// - This PDF reports cutoffs per SEAT TYPE (e.g. GOPEN, GOBC, GST, GNTC,
//   LOPEN, LST, EWS — "G" = general seat, "L" = ladies-reserved seat),
//   which is finer-grained than this app's 8-category model
//   (OPEN/OBC/SC/ST/VJ/NT/SBC/EWS). We map the G-prefixed row for a given
//   category onto our category model and IGNORE ladies-reserved (L-) rows.
// - Many category+branch combinations have NO published row in this
//   round — that usually means Round I already filled that category's
//   open seats, not that the cutoff is unusually low. Where we have no
//   real row, the original generated/estimated number is left in place
//   and isRealData stays unset.
// - Only 2 colleges in this app's dataset were reachable within this PDF
//   during this session (institute codes 2008 and 2020); Pune/Mumbai
//   institutes were not reachable — see README "Data notes" for why.

const fs = require('fs');

const SOURCE_CITATION =
  'Real DTE CAP Round II 2025-26 cutoff, transcribed verbatim from ' +
  'dse2025.mahacet.org.in/dse25/staticFiles/dse_cap2_cut_off_2025_26.pdf ' +
  '(State Common Entrance Test Cell, Mumbai). Diploma percentage as ' +
  'published; merit number omitted here. Fetched June 2026.';

// REAL_CUTOFFS[college_id][branch_id][category_id] = cutoff_percentage
// Only entries actually present in the PDF excerpt we retrieved are
// listed here. Missing entries are left as the generated/estimated value.
const REAL_CUTOFFS = {
  'gcoe-aurangabad': {
    // Civil: only an LST (ladies-ST) row was published this round — no
    // GOPEN row, so OPEN stays estimated. We do have the general-seat
    // OBC-equivalent? No — only LST published for Civil. Skipping Civil.
    it: { ST: 77.31, EWS: 90.69 }, // GST, EWS rows
    electrical: {}, // only LOBC (ladies) row published — no general row usable
    entc: { OPEN: 91.76 }, // GOPEN row
    mech: {}, // only LST/LSEBC (ladies) rows published — no general row usable
  },
  'sggscoe-nanded': {
    civil: { OBC: 89.53, EWS: 87.95 }, // GOBC, EWS rows
    comp: { SBC: 91.71 }, // GSEBC row maps to our SBC category
  },
};

const cutoffsPath = 'lib/data/cutoffs.json';
const cutoffs = JSON.parse(fs.readFileSync(cutoffsPath));

let appliedCount = 0;
for (const cutoff of cutoffs) {
  const collegeReal = REAL_CUTOFFS[cutoff.college_id];
  if (!collegeReal) continue;
  const branchReal = collegeReal[cutoff.branch_id];
  if (!branchReal) continue;
  const realValue = branchReal[cutoff.category_id];
  if (realValue === undefined) continue;

  cutoff.cutoff_percentage = realValue;
  cutoff.isRealData = true;
  cutoff.source = SOURCE_CITATION;
  // Recompute rank estimate consistently with the generator's formula
  // so the UI's "previous cutoff" and any rank display stay coherent.
  cutoff.cutoff_rank = Math.round((100 - realValue) * 1500 + 200);
  appliedCount++;
}

fs.writeFileSync(cutoffsPath, JSON.stringify(cutoffs, null, 2));
console.log(`Applied ${appliedCount} real cutoff rows from official DTE CAP data.`);
