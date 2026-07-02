import "server-only";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".local-data");
const FILE_PATH = path.join(DATA_DIR, "saved-colleges.json");

interface SavedRecord {
  sessionId: string;
  collegeId: string;
  branchId: string;
  savedAt: string;
}

function ensureStore(): SavedRecord[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, "[]", "utf-8");
  }
  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  try {
    return JSON.parse(raw) as SavedRecord[];
  } catch {
    return [];
  }
}

function writeStore(records: SavedRecord[]) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
}

export function saveCollege(
  sessionId: string,
  collegeId: string,
  branchId: string
) {
  const records = ensureStore();
  const exists = records.some(
    (r) =>
      r.sessionId === sessionId &&
      r.collegeId === collegeId &&
      r.branchId === branchId
  );
  if (!exists) {
    records.push({
      sessionId,
      collegeId,
      branchId,
      savedAt: new Date().toISOString(),
    });
    writeStore(records);
  }
  return records.filter((r) => r.sessionId === sessionId);
}

export function unsaveCollege(
  sessionId: string,
  collegeId: string,
  branchId: string
) {
  const records = ensureStore().filter(
    (r) =>
      !(
        r.sessionId === sessionId &&
        r.collegeId === collegeId &&
        r.branchId === branchId
      )
  );
  writeStore(records);
  return records.filter((r) => r.sessionId === sessionId);
}

export function getSavedColleges(sessionId: string) {
  return ensureStore().filter((r) => r.sessionId === sessionId);
}
