const fs = require('fs');
const colleges = JSON.parse(fs.readFileSync('lib/data/colleges.json'));
const branches = JSON.parse(fs.readFileSync('lib/data/branches.json'));
const categories = JSON.parse(fs.readFileSync('lib/data/categories.json'));

function baseCutoffFor(college, branch) {
  let base = 55 + (college.placementScore - 0.8) * 60;
  const tierAdj = { high: 6, medium: 1, low: -6 };
  base += tierAdj[branch.demandTier] || 0;
  const hash = (college.id + branch.id).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  base += (hash % 7) - 3;
  return Math.max(38, Math.min(99.5, base));
}

// Real cited OPEN-category percentile midpoints for CS/IT/Mech/Civil where
// a source gave a range. These override the generic formula for these
// specific college+branch combos. Source: predictcollege.in (Apr 2026).
const REAL_ANCHORS = {
  'sggscoe-nanded': { comp: 84.5, it: 82, mech: 77, civil: 71.5 },
  'gcoe-aurangabad': { comp: 87.5, it: 84, mech: 77, civil: 71.5 },
  'wit-solapur': { comp: 86.5, it: 83, mech: 77, civil: 71 },
  'gcoe-karad': { comp: 82.5, it: 78, mech: 73, civil: 67 },
};

const catDemand = { OPEN: 0, OBC: -4.5, SC: -14, ST: -18, VJ: -10, NT: -10, SBC: -8, EWS: -3 };

const cutoffs = [];
let id = 1;
for (const college of colleges) {
  for (const branchId of college.branchIds) {
    const branch = branches.find(b => b.id === branchId);
    const anchor = REAL_ANCHORS[college.id]?.[branchId];
    const baseOpen = anchor !== undefined ? anchor : baseCutoffFor(college, branch);
    for (const cat of categories) {
      let cutoff = baseOpen + (catDemand[cat.id] ?? 0);
      cutoff = Math.max(35, Math.min(99.8, cutoff));
      cutoff = Math.round(cutoff * 100) / 100;
      cutoffs.push({
        id: id++,
        college_id: college.id,
        branch_id: branch.id,
        category_id: cat.id,
        year: 2025,
        round: "CAP Round 2",
        cutoff_percentage: cutoff,
        cutoff_rank: Math.round((100 - cutoff) * 1500 + 200)
      });
    }
  }
}
fs.writeFileSync('lib/data/cutoffs.json', JSON.stringify(cutoffs, null, 2));
console.log('Generated', cutoffs.length, 'cutoff records for', colleges.length, 'colleges');
