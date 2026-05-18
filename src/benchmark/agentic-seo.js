import { execSync } from "child_process";

export async function runBenchmark(target) {
  try {
    const args =
      target && target.startsWith("http")
        ? `--url ${target} --json`
        : `${target || "."} --json`;

    const output = execSync(`npx agentic-seo ${args}`, {
      timeout: 30000,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const result = JSON.parse(output);
    return {
      score: result.score ?? result.percentage ?? 0,
      maxScore: 100,
      grade: result.grade || null,
      categories: result.categories || null,
      available: true,
    };
  } catch (err) {
    if (err.message?.includes("not found") || err.message?.includes("ENOENT")) {
      return {
        score: null,
        maxScore: 100,
        available: false,
        reason: "agentic-seo not installed",
      };
    }
    return {
      score: null,
      maxScore: 100,
      available: false,
      reason: err.message?.slice(0, 100),
    };
  }
}
