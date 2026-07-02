# CAP Guru AI

An AI-assisted CAP (Centralized Admission Process) college predictor for
Maharashtra diploma-to-degree engineering admissions. Students enter their
diploma percentage, category, branch and city preference, college type,
budget, and placement priority, and get back matching colleges with
previous-year cutoffs, an expected current-year cutoff range, admission
chance, placement data, fees, and an AI-generated recommendation.

## What's built in this pass

This is the **core predictor experience**, built end-to-end and working:

- **Predictor form -> results** with live filters (city, branch, college
  type, chance, fee ceiling). City is a free-type input with autocomplete:
  type any city name, pick a suggestion, or leave it blank/type something
  unrecognized and it falls back to "any city" rather than silently
  returning zero results.
- **Expected cutoff & chance engine**, implementing the exact formula and
  thresholds from the spec
- **Preference list generator** -- Dream / Target / Safe tiers in CAP
  option-form order
- **College comparison** (2-3 colleges side by side)
- **College detail pages** with cutoffs by category, placement, fees,
  pros/cons, and a data-provenance note on colleges added from real
  research
- **AI Counselor chat** -- rule-based today, answers only from the bundled
  dataset and explicitly says when it doesn't have something
- **Save college** (anonymous session, cookie-based) and **search
  history** (stored on-device)
- All the predictor-facing **API routes** from the spec
- **29 colleges across 16 Maharashtra cities/districts** (Pune, Mumbai,
  Navi Mumbai, Thane, Nashik, Nagpur, Chhatrapati Sambhajinagar
  (Aurangabad), Kolhapur, Solapur, Sangli, Satara, Karad, Jalgaon,
  Ahmednagar, Amravati, Nanded, Latur, Akola, Chandrapur, Yavatmal,
  Dhule, Ratnagiri, Wardha), all 5 named branches plus Mechanical,
  Civil, and Electrical — see "Data notes" below for which entries are
  verified-real vs. illustrative

**Not built in this pass** (by agreed scope -- see "Extending this" below):
student/admin authentication, the full admin CRUD panel, CSV/Excel import,
and a real LLM-backed counselor. The code is structured so each of these
slots in without restructuring what exists.

## Tech stack

- **Framework**: Next.js 16 (App Router), TypeScript, React 19
- **Styling**: Tailwind CSS v4
- **Data layer**: JSON seed files read through a single repository module
  (`lib/repository.ts`) -- this is the seam to swap in MySQL later
- **Persistence for saved colleges**: a small JSON file on disk
  (`.local-data/saved-colleges.json`), keyed by an anonymous session
  cookie -- a real, working persistence path with no login required yet

No external API keys are required to run this. The AI Counselor uses a
rule-based answer engine over the same dataset (see "Swapping in a real
AI model" below).

## Project structure

```
app/
  page.tsx                       Home page (predictor form)
  results/                       Results + filters
  preference-list/               Dream/Target/Safe list
  compare/                       Side-by-side comparison
  college/[id]/                  College detail page
  counselor/                     AI Counselor chat
  saved/                         Saved colleges + search history
  api/
    predict-colleges/            POST -- core predictor
    colleges/                    GET -- list colleges
    colleges/[id]/                GET -- college detail
    generate-preference-list/    POST -- Dream/Target/Safe
    compare-colleges/            POST -- comparison
    ai-counselor/                POST -- chat answers
    save-college/                POST -- save/unsave
    saved-colleges/               GET -- saved list
components/                       Shared UI (Header, ResultCard, ChanceBadge)
lib/
  types.ts                       Shared TypeScript types
  data/*.json                    Seed data (cities, colleges, cutoffs, ...)
  repository.ts                  Data access layer (swap seam for MySQL)
  prediction.ts                  Cutoff/chance engine
  preferenceList.ts              Dream/Target/Safe generator
  compare.ts                     Comparison logic
  aiCounselor.ts                 Rule-based chat engine
  savedStore.ts                  File-backed saved-college store
  clientStore.ts                 Browser localStorage helpers
```

## Running it locally

Requires Node.js 18.18+ (Node 20+ recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For a production build:

```bash
npm run build
npm run start
```

## The prediction formula, as implemented

**Chance logic** (`lib/prediction.ts -> calculateChance`):
- High: student percentage >= previous cutoff + 2
- Medium: within +/-2 of previous cutoff
- Low: student percentage < previous cutoff - 2

**Expected cutoff** (`calculateExpectedCutoff`):
```
expected = previous_cutoff
  + branch_demand_adjustment    (high: +1.5, medium: +0.7, low: +0.2)
  + placement_adjustment        (+1.2 if college placementScore >= 1.1)
  + city_demand_adjustment      (+1.0 if city demandScore >= 0.9)
  - seat_availability_adjustment (-0.8 if college runs 7+ branches, -0.4 if 5-6)

range = [expected - 1, expected + 1]
```

Seat *count* isn't a literal column in the seed data, so seat availability
is approximated from how many branches a college offers (broader
infrastructure ~ more seats). Swap in a real seats column on the
`college_branches` table when migrating to MySQL and this becomes exact.

## Web search setup

The "Web search" box on the home page looks up any Maharashtra college on
the live web (it doesn't feed the predictor — it's a separate lookup tool
for colleges you can't find in our database yet).

1. Sign up at [brave.com/search/api](https://brave.com/search/api/) and
   generate a subscription token. New accounts get a small free credit
   ($5, roughly 1,000 queries as of mid-2026); beyond that, usage is
   billed by Brave directly at their published per-query rate — check
   their pricing page, since it has changed more than once in 2025-26.
2. Copy `.env.example` to `.env.local` and paste your key into
   `BRAVE_SEARCH_API_KEY`.
3. Restart `npm run dev` / `npm run start`.

Without a key set, the search box shows a clear "not configured yet"
message instead of failing silently.

**Swapping providers**: the entire integration lives in
`app/api/search-colleges/route.ts`, inside the `searchWeb()` function.
Replace its body with a call to SerpAPI, Tavily, or any other search API
and keep the same return shape (`{ title, url, snippet, source }[]`) —
nothing else in the app needs to change.

## Real cutoff data

Two colleges in this dataset — **GCOE Aurangabad** and **SGGSCOE
Nanded** — have cutoff numbers transcribed verbatim from an official DTE
source: the *"Provisional Cutoff List of CAP Round II For Admission to
Direct Second Year of Full Time Under Graduate Courses in
Engineering/Technology for AY 2025-26"* PDF, published by the State
Common Entrance Test Cell, Mumbai
(`dse2025.mahacet.org.in/dse25/staticFiles/dse_cap2_cut_off_2025_26.pdf`).

These rows are marked `isRealData: true` in `lib/data/cutoffs.json` and
show a green "Verified, DTE 2025-26" badge on the college detail page and
predictor result cards. Every other cutoff in the dataset is still
estimated — see "Data notes" below for the full breakdown.

**Why only 2 colleges**: that PDF is the real, authoritative source for
this exact use case (diploma-to-degree CAP admissions), but it's nearly
1,000 pages, ordered by institute code, and the tooling available in
this environment could only retrieve the first ~62 pages of it (institute
codes 1002–1276, in the Amravati/Vidarbha region, plus 2008 and 2020 —
Aurangabad and Nanded). Pune (institute codes ~6xxx) and Mumbai (~3xxx),
which most of this dataset's colleges are in, were not reachable in this
session.

**To get real data for more colleges**: download the PDF directly (a
browser, unlike this environment's fetch tool, isn't blocked by the
site's bot detection) and either transcribe specific college/branch/
category rows into the `REAL_ANCHORS`-style object in
`scripts/apply-real-cutoffs.js`, or write a proper PDF-table parser
(the format is consistent: institute header, choice code + course name,
a row of seat-type codes, then a row of merit-number+percentage pairs).
Re-run `node scripts/apply-real-cutoffs.js` after updating it.

Also note: this PDF reports cutoffs per **seat type** (GOPEN, GOBC, GST,
GNTA–D, LOPEN, LST, etc. — "G" = general seat, "L" = ladies-reserved
seat), which is finer-grained than this app's 8-category model. We map
the general-seat ("G"-prefixed) row for a category onto our model and
don't use ladies-reserved rows. Several category+branch combinations
have no published row in a given round (Round I often already fills
those open seats) — where that's the case, the original estimate is left
in place rather than invented.

## Adding more colleges

1. Add a city to `lib/data/cities.json` if it's not there yet (id, name,
   demandScore — 1.0 for top-tier metro demand, scaling down for smaller
   towns).
2. Add the college to `lib/data/colleges.json` (id, name, cityId, type,
   branchIds, placementScore, etc.). Add a `dataSource` string if you're
   using real, cited figures, so the UI shows a provenance note.
3. Run `node scripts/generate-cutoffs.js` and
   `node scripts/generate-placements-fees.js` from the project root to
   regenerate `cutoffs.json`, `placements.json`, and `fees.json` for
   every college. Both scripts support a `REAL_ANCHORS` /
   `REAL_PACKAGE_ANCHORS` / `REAL_FEE_ANCHORS` object near the top where
   you can hard-code real cited numbers for specific college+branch
   combos; everything else is filled in by the generic formula so the
   dataset stays internally consistent.
4. If you have real cutoff rows transcribed from an official DTE PDF,
   add them to `REAL_CUTOFFS` in `scripts/apply-real-cutoffs.js` and run
   it last — it overlays real numbers on top of the generated ones and
   marks them `isRealData: true` so the UI shows the "Verified" badge.

## Extending this

### Swapping the data layer for MySQL

Every page and API route reads through `lib/repository.ts`. To move to
MySQL: stand up the tables described in the original spec (`colleges`,
`branches`, `cutoffs`, `placements`, `fees`, `cities`, `categories`,
`college_branches`), then rewrite each function in `repository.ts` to run
a query instead of reading the JSON files, keeping the same function
signatures. Nothing else in the app needs to change.

### Swapping in a real AI model

`lib/aiCounselor.ts` is a small rule-based intent router. The
`/api/ai-counselor` route is the integration point -- replace the call to
`answerCounselorQuestion()` with a call to OpenAI or Gemini, passing the
same structured data (`getColleges()`, `getCutoffs()`, `getPlacements()`,
etc.) as grounding context in the system prompt, and instruct the model to
answer only from that context and say so when it can't. This keeps the
"answers using only available database data" requirement intact even with
a real model behind it.

### Adding auth, admin panel, and CSV import

These weren't built in this pass. Suggested approach when you're ready:

- **Auth**: NextAuth.js (or a custom JWT flow) for student/admin login;
  swap the anonymous session cookie in `save-college` for a real user id.
- **Admin panel**: an `/admin` route group with CRUD forms over the same
  `repository.ts` functions (once backed by MySQL, these become real
  writes instead of read-only JSON).
- **CSV import**: `papaparse` on an `/api/admin/cutoffs/import` route,
  validating rows against the `Cutoff` type before inserting.
- **predictions / preference_lists / comparison_history tables**: once
  MySQL is in place, log each call to `predictColleges`,
  `generatePreferenceList`, and `compareColleges` into these tables for a
  real dashboard and history.

## Data notes

This dataset mixes two kinds of entries, distinguishable by whether a
college has a `dataSource` field in `lib/data/colleges.json` (also shown
on its detail page as a "Data note"):

- **Original 12 colleges** (VIT Pune, PCCOE Pune, PICT Pune, AISSMS COE
  Pune, DY Patil Akurdi, JSPM Tathawade, MIT AOE Alandi, KJ Somaiya
  Mumbai, DJ Sanghvi Mumbai, Thakur College Mumbai, GCOE Jalgaon, GCOE
  Karad): real institutions, but cutoff/placement/fee figures are
  **illustrative sample data** generated to be internally consistent
  (higher-placement colleges have higher cutoffs and packages).

- **17 additional colleges** added across Pune, Mumbai, Sangli, Nanded,
  Aurangabad, Solapur, Nagpur, Chandrapur, Yavatmal, Kolhapur, Amravati,
  Ahmednagar, Nashik, and Latur: real institutions verified via web
  search (COEP Pune, VJTI Mumbai, Walchand Sangli, SGGSCOE Nanded, GCOE
  Aurangabad, WIT Solapur, GCOE Nagpur, VNIT Nagpur, GCOE Chandrapur,
  GCOE Yavatmal, KIT Kolhapur, SSGMCE Shegaon, Pravara Loni, KK Wagh
  Nashik, GCOE Latur, RIT Islampur, Vidyalankar Mumbai). For a handful of
  these, real cited figures were used as anchors:
  - SGGSCOE Nanded, GCOE Aurangabad, WIT Solapur, GCOE Karad: OPEN-category
    cutoff *percentile ranges* for CS/IT/Mech/Civil, sourced from
    predictcollege.in (April 2026)
  - VNIT Nagpur, COEP Pune, VJTI Mumbai: placement package figures,
    sourced from vedantu.com / careers360.com 2025-26 rankings coverage
  - KIT Kolhapur: total 4-year fee range, sourced from collegedekho.com

  Every other number on these 17 entries (and all numbers on colleges
  without a real anchor) is still **estimated**, not transcribed from an
  official source.

**What this is not**: a scrape of the Maharashtra DTE's actual CAP cutoff
PDFs. Those exist (e.g. `dse2025.mahacet.org.in/.../DSE_CAP1_CutOff_2025_26.pdf`)
but are large, code-keyed PDFs that change every round and aren't
something to hand-transcribe into a college predictor without a proper
parsing pipeline. **Before using this for a real admission decision,
replace `lib/data/cutoffs.json`, `placements.json`, and `fees.json` with
numbers pulled from the official DTE/CAP cutoff PDFs for the current
year** — the in-app disclaimer says as much, and the per-college "Data
note" makes clear which entries still need that replacement.

Also note: VNIT Nagpur is included for reference but is a National
Institute of Technology (admits primarily via JEE Main/Advanced), not a
standard Maharashtra CAP-round college — verify eligibility before
treating it as a normal CAP option.

The 16-city list itself (Pune, Mumbai, Navi Mumbai, Thane, Nashik,
Nagpur, Chhatrapati Sambhajinagar, Kolhapur, Solapur, Sangli, Satara,
Karad, Jalgaon, Ahmednagar, Amravati, Nanded, Latur, Akola, Chandrapur,
Yavatmal, Dhule, Ratnagiri, Wardha) reflects real Maharashtra districts
with engineering colleges, confirmed via web search (collegedunia.com,
betterstudy.in, zollege.in city-college listings, June 2026) — but not
every city yet has a college entered in this dataset. Adding more is
just a matter of appending to `lib/data/colleges.json` and the
generator scripts described below.
