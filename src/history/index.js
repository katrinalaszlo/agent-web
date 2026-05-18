import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DIR_NAME = ".agent-web";
const HISTORY_FILE = "history.json";

export async function saveResult(result, baseDir) {
  const dir = join(baseDir, DIR_NAME);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const historyPath = join(dir, HISTORY_FILE);
  const history = loadHistory(historyPath);

  history.scans.push({
    id: generateId(),
    timestamp: result.timestamp,
    score: result.score,
    grade: result.grade,
    siteType: result.siteType,
    target: result.target,
    agentReadiness: result.agentReadiness.score,
    aiVisibility: result.aiVisibility.score,
    benchmark: result.benchmark?.score ?? null,
  });

  writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

export function loadHistory(historyPath) {
  if (existsSync(historyPath)) {
    try {
      return JSON.parse(readFileSync(historyPath, "utf8"));
    } catch {
      /* corrupted — start fresh */
    }
  }
  return { scans: [] };
}

export function getHistory(baseDir) {
  const historyPath = join(baseDir, DIR_NAME, HISTORY_FILE);
  return loadHistory(historyPath);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
