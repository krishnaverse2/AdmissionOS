const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");

const PDF_PATH = path.join(process.cwd(), "data", "raw", "dse-cutoff-2025.pdf");
const OUT_DIR = path.join(process.cwd(), "lib", "data");

const CATEGORY_CODES = [
  "PWDR-OBC", "PWDR-SC", "PWDR-ST", "PWDR-SEBC",
  "DEFR-OBC", "DEFR-SC", "DEFR-ST", "DEFR-SEBC",
  "PWD-O", "DEF-O",
  "GSEBC", "LSEBC",
  "GOPEN", "LOPEN",
  "GOBC", "LOBC",
  "GSC", "LSC",
  "GST", "LST",
  "GNTA", "LNTA",
  "GNTB", "LNTB",
  "GNTC", "LNTC",
  "GNTD", "LNTD",
  "EWS", "MI"
].sort((a, b) => b.length - a.length);

function clean(text) {
  return String(text).replace(/\s+/g, " ").trim();
}

function slugify(text) {
  return clean(text)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCityFromCollegeName(name) {
  const parts = name.split(",");
  const city = parts[parts.length - 1]?.replace(/\(.*?\)/g, "").trim();
  return city || "Maharashtra";
}

function getCollegeType(text) {
  if (/government/i.test(text)) return "Government";
  if (/autonomous/i.test(text)) return "Autonomous";
  return "Private";
}

function demandTier(courseName) {
  const n = courseName.toLowerCase();

  if (
    n.includes("computer") ||
    n.includes("information technology") ||
    n.includes("artificial intelligence") ||
    n.includes("data science") ||
    n.includes("machine learning") ||
    n.includes("iot")
  ) {
    return "high";
  }

  if (n.includes("civil") || n.includes("mechanical") || n.includes("electrical")) {
    return "low";
  }

  return "medium";
}

function categoryName(code) {
  const names = {
    GOPEN: "General Open",
    LOPEN: "Ladies Open",
    GSC: "General SC",
    LSC: "Ladies SC",
    GST: "General ST",
    LST: "Ladies ST",
    GOBC: "General OBC",
    LOBC: "Ladies OBC",
    GSEBC: "General SEBC",
    LSEBC: "Ladies SEBC",
    GNTA: "General NT-A",
    LNTA: "Ladies NT-A",
    GNTB: "General NT-B",
    LNTB: "Ladies NT-B",
    GNTC: "General NT-C",
    LNTC: "Ladies NT-C",
    GNTD: "General NT-D",
    LNTD: "Ladies NT-D",
    EWS: "Economically Weaker Section",
    MI: "Minority",
    "PWD-O": "PWD Open",
    "PWDR-OBC": "PWD OBC",
    "PWDR-SC": "PWD SC",
    "PWDR-ST": "PWD ST",
    "PWDR-SEBC": "PWD SEBC",
    "DEF-O": "Defence Open",
    "DEFR-OBC": "Defence OBC",
    "DEFR-SC": "Defence SC",
    "DEFR-ST": "Defence ST",
    "DEFR-SEBC": "Defence SEBC",
  };

  return names[code] || code;
}

function splitCategories(raw) {
  let text = String(raw)
    .replace(/[^A-Z0-9\-]/g, "")
    .trim();

  const result = [];

  while (text.length > 0) {
    let found = "";

    for (const code of CATEGORY_CODES) {
      if (text.startsWith(code)) {
        found = code;
        break;
      }
    }

    if (found) {
      result.push(found);
      text = text.slice(found.length);
    } else {
      text = text.slice(1);
    }
  }

  return result;
}

function parseRankPercent(text) {
  const match = String(text).match(/(\d+)\s*\(\s*([\d.]+)\s*%\s*\)/);
  if (!match) return null;

  return {
    rank: Number(match[1]),
    percentage: Number(match[2]),
  };
}

function addFixedCategories(categoriesMap) {
  for (const code of CATEGORY_CODES) {
    categoriesMap.set(code, {
      id: code,
      name: categoryName(code),
      demandAdjustment: 0,
    });
  }
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    console.error("PDF not found:", PDF_PATH);
    process.exit(1);
  }

  const buffer = fs.readFileSync(PDF_PATH);
  const data = await pdf(buffer);
  const text = data.text;

  const collegesMap = new Map();
  const branchesMap = new Map();
  const citiesMap = new Map();
  const categoriesMap = new Map();
  const cutoffs = [];

  addFixedCategories(categoriesMap);

  const courseRegex =
    /(\d{4})\s+(.+?)\s*\((.+?)\)\s*Choice Code\s*:\s*(\d+)\s*Course Name\s*:\s*([\s\S]*?)(?=\n\d{4}\s+.+?\s*\(.+?\)\s*Choice Code\s*:|L - Ladies|STATE CET CELL|$)/g;

  let match;
  let cutoffId = 1;

  while ((match = courseRegex.exec(text)) !== null) {
    const instituteCode = match[1].trim();
    const collegeName = clean(match[2]);
    const instituteTypeText = clean(match[3]);
    const choiceCode = match[4].trim();

    const blockText = match[0];
    const blockLines = blockText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const courseLineIndex = blockLines.findIndex((line) =>
      /Course Name\s*:/i.test(line)
    );

    let courseName = "";
    if (courseLineIndex >= 0) {
      courseName = clean(
        blockLines[courseLineIndex].replace(/^.*Course Name\s*:\s*/i, "")
      );
    }

    if (!courseName) {
      courseName = clean(match[5].split("\n")[0]);
    }

    const collegeId = instituteCode;
    const branchId = slugify(courseName);
    const cityName = getCityFromCollegeName(collegeName);
    const cityId = slugify(cityName);

    if (!citiesMap.has(cityId)) {
      citiesMap.set(cityId, {
        id: cityId,
        name: cityName,
        demandScore:
          cityName.toLowerCase().includes("pune") ||
          cityName.toLowerCase().includes("mumbai")
            ? 10
            : 6,
      });
    }

    if (!branchesMap.has(branchId)) {
      branchesMap.set(branchId, {
        id: branchId,
        name: courseName,
        code: choiceCode,
        demandTier: demandTier(courseName),
      });
    }

    if (!collegesMap.has(collegeId)) {
      collegesMap.set(collegeId, {
        id: collegeId,
        name: collegeName,
        shortName: collegeName.split(",")[0].slice(0, 35),
        cityId,
        address: cityName,
        website: "",
        type: getCollegeType(instituteTypeText + " " + collegeName),
        status: "active",
        placementScore: 70,
        hostel: false,
        branchIds: [],
        pros: ["Official DSE cutoff data available"],
        cons: ["Fees and placement data need verification"],
        dataSource: "Maharashtra CET Cell DSE CAP Round I Cutoff 2025 PDF",
      });
    }

    const college = collegesMap.get(collegeId);
    if (!college.branchIds.includes(branchId)) {
      college.branchIds.push(branchId);
    }

    for (let i = 0; i < blockLines.length; i++) {
      if (!/^Stage-/i.test(blockLines[i])) continue;

      const stage = blockLines[i].split(/\s+/)[0];

      let categoryRaw = "";
      for (let j = i - 1; j >= 0; j--) {
        const line = blockLines[j];

        if (/Course Name|Choice Code|^\d{4}\s/.test(line)) break;

        const possible = line.replace(/[^A-Z0-9\-]/g, "");
        const detected = splitCategories(possible);

        if (detected.length > 0) {
          categoryRaw = possible;
          break;
        }
      }

      const categories = splitCategories(categoryRaw);

      let valueText = "";
      for (let j = i; j < blockLines.length; j++) {
        if (j > i && /^Stage-/i.test(blockLines[j])) break;
        if (j > i && /Choice Code\s*:/i.test(blockLines[j])) break;
        valueText += " " + blockLines[j];
      }

      const values = [
        ...valueText.matchAll(/(\d+\s*\(\s*[\d.]+\s*%\s*\))/g),
      ].map((m) => m[1]);

      const count = Math.min(categories.length, values.length);

      for (let k = 0; k < count; k++) {
        const parsed = parseRankPercent(values[k]);
        if (!parsed) continue;

        cutoffs.push({
          id: cutoffId++,
          college_id: collegeId,
          branch_id: branchId,
          category_id: categories[k],
          year: 2025,
          round: `CAP Round I - ${stage}`,
          cutoff_percentage: parsed.percentage,
          cutoff_rank: parsed.rank,
          isRealData: true,
          source: "Maharashtra CET Cell DSE CAP Round I Cutoff 2025 PDF",
        });
      }
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  fs.writeFileSync(path.join(OUT_DIR, "cities.json"), JSON.stringify([...citiesMap.values()], null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "categories.json"), JSON.stringify([...categoriesMap.values()], null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "branches.json"), JSON.stringify([...branchesMap.values()], null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "colleges.json"), JSON.stringify([...collegesMap.values()], null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "cutoffs.json"), JSON.stringify(cutoffs, null, 2));

  console.log("Import completed!");
  console.log("Colleges:", collegesMap.size);
  console.log("Branches:", branchesMap.size);
  console.log("Cities:", citiesMap.size);
  console.log("Categories:", categoriesMap.size);
  console.log("Cutoffs:", cutoffs.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});