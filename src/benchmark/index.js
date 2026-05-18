import chalk from "chalk";
import { runBenchmark as runAgenticSeo } from "./agentic-seo.js";
import { runCloudflare } from "./cloudflare.js";
import { runFern } from "./fern.js";

export async function runAllBenchmarks(target) {
  const isUrl = target && target.startsWith("http");

  const results = await Promise.allSettled([
    runAgenticSeo(target),
    isUrl ? runCloudflare(target) : Promise.resolve(null),
    isUrl ? runFern(target) : Promise.resolve(null),
  ]);

  const benchmarks = {
    agenticSeo: results[0].status === "fulfilled" ? results[0].value : null,
    cloudflare: results[1].status === "fulfilled" ? results[1].value : null,
    fern: results[2].status === "fulfilled" ? results[2].value : null,
  };

  return benchmarks;
}

export function printBenchmarks(benchmarks) {
  const any = Object.values(benchmarks).some((b) => b && b.available);
  if (!any) return;

  console.log(
    chalk.bold("\n  ─── Benchmarks ────────────────────────────────────\n"),
  );

  if (benchmarks.agenticSeo?.available) {
    const b = benchmarks.agenticSeo;
    printBenchmarkLine(
      "agentic-seo",
      b.score,
      b.maxScore,
      b.grade,
      b.categories,
    );
  }

  if (benchmarks.cloudflare?.available) {
    const b = benchmarks.cloudflare;
    printBenchmarkLine(
      "Cloudflare",
      b.score,
      b.maxScore,
      b.grade,
      b.categories,
    );
  }

  if (benchmarks.fern?.available) {
    const b = benchmarks.fern;
    printBenchmarkLine("Fern", b.score, b.maxScore, b.grade, b.categories);
  }

  console.log("");
}

function printBenchmarkLine(name, score, maxScore, grade, categories) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const barWidth = 16;
  const filled = Math.round((pct / 100) * barWidth);
  const color = pct >= 80 ? chalk.green : pct >= 50 ? chalk.yellow : chalk.red;
  const bar =
    color("█".repeat(filled)) + chalk.dim("░".repeat(barWidth - filled));
  const gradeStr = grade ? chalk.dim(` (${grade})`) : "";

  console.log(
    `  ${bar} ${name.padEnd(16)} ${chalk.dim(`${score}/${maxScore}`)}${gradeStr}`,
  );

  if (categories) {
    for (const [, cat] of Object.entries(categories)) {
      const catName = cat.name || cat;
      const catPct =
        cat.percentage ??
        (cat.maxScore > 0 ? Math.round((cat.score / cat.maxScore) * 100) : 0);
      const icon =
        catPct >= 80
          ? chalk.green("✓")
          : catPct >= 40
            ? chalk.yellow("◑")
            : chalk.red("✗");
      console.log(
        chalk.dim(
          `    ${icon} ${(catName || "").padEnd(22)} ${cat.score}/${cat.maxScore}`,
        ),
      );
    }
  }
}
