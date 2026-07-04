const fs = require("fs");
const path = require("path");

const colleges = require("../lib/data/colleges.json");

const OUT = path.join(process.cwd(), "lib", "data", "placements.json");

function isComputerBranch(branchId) {
  return /computer|information|artificial|data|cyber|iot|software|technology|electronics-and-computer/.test(
    branchId
  );
}

function basePackage(college, branchId) {
  const name = college.name.toLowerCase();
  let avg = 3.5;
  let highest = 8;
  let percent = 55;

  if (college.type === "Government") {
    avg += 1.5;
    highest += 5;
    percent += 10;
  }

  if (college.type === "Autonomous") {
    avg += 1.2;
    highest += 4;
    percent += 8;
  }

  if (isComputerBranch(branchId)) {
    avg += 1.8;
    highest += 6;
    percent += 12;
  }

  if (
    name.includes("vjti") ||
    name.includes("veermata") ||
    name.includes("sardar patel") ||
    name.includes("pict") ||
    name.includes("dwarkadas") ||
    name.includes("sanghvi") ||
    name.includes("coep")
  ) {
    avg += 5;
    highest += 20;
    percent += 15;
  }

  if (
    name.includes("thadomal") ||
    name.includes("vit") ||
    name.includes("vidyalankar") ||
    name.includes("ves") ||
    name.includes("fr. conceicao") ||
    name.includes("thakur college")
  ) {
    avg += 3;
    highest += 12;
    percent += 12;
  }

  avg = Math.min(Number(avg.toFixed(1)), 14);
  highest = Math.min(Number(highest.toFixed(1)), 45);
  percent = Math.min(percent, 95);

  return { avg, highest, percent };
}

let id = 1;
const placements = [];

for (const college of colleges) {
  for (const branchId of college.branchIds) {
    const p = basePackage(college, branchId);

    placements.push({
      id: id++,
      college_id: college.id,
      branch_id: branchId,
      year: 2025,
      average_package: p.avg,
      highest_package: p.highest,
      placement_percentage: p.percent,
      top_recruiters: [],
      data_type: "estimated",
      source: "Estimated package data. Verify from official college placement report."
    });
  }
}

fs.writeFileSync(OUT, JSON.stringify(placements, null, 2));

console.log("placements.json generated");
console.log("Total placement rows:", placements.length);