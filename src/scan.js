import chalk from "chalk";
import { runAllBenchmarks, printBenchmarks } from "./benchmark/index.js";
import { saveResult } from "./history/index.js";
import { generateDashboard } from "./dashboard/generate.js";
import { exec } from "child_process";

export async function scan(opts) {
  const { url, dir, json } = opts;

  if (!json) {
    console.log(
      chalk.bold("\n  aeo-ready") + chalk.dim(" — AEO benchmark aggregator\n"),
    );
    console.log(chalk.dim(`  Scanning ${url}...\n`));
  }

  const benchmarks = await runAllBenchmarks(url, dir);
  const scores = collectScores(benchmarks);
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : 0;

  const result = {
    url,
    timestamp: new Date().toISOString(),
    averageScore,
    benchmarks,
  };

  if (!json) {
    printReport(result);
  }

  const baseDir = process.cwd();
  await saveResult(result, baseDir);

  if (!json) {
    const dashPath = await generateDashboard(result, baseDir);
    console.log(chalk.dim(`  Dashboard: ${dashPath}\n`));
    openInBrowser(dashPath);
  }

  return result;
}

function collectScores(benchmarks) {
  const scores = [];
  if (benchmarks.agenticSeo?.available) {
    scores.push(benchmarks.agenticSeo.score);
  }
  if (benchmarks.cloudflare?.available) {
    scores.push(
      Math.round(
        (benchmarks.cloudflare.score / benchmarks.cloudflare.maxScore) * 100,
      ),
    );
  }
  if (benchmarks.fern?.available) {
    scores.push(benchmarks.fern.score);
  }
  return scores;
}

function printReport(result) {
  const { benchmarks, averageScore } = result;

  printBenchmarks(benchmarks);

  const gc =
    averageScore >= 80
      ? chalk.green
      : averageScore >= 50
        ? chalk.yellow
        : chalk.red;
  console.log(
    chalk.dim("  ─────────────────────────────────────────────────\n"),
  );
  console.log(
    `  Average across all sources: ${gc.bold(`${averageScore}/100`)}\n`,
  );

  if (averageScore < 80) {
    console.log(chalk.bold("  Fix it:\n"));
    console.log(
      chalk.dim("    npx agentic-seo init") +
        "          scaffold llms.txt, AGENTS.md, skill.md",
    );

    const cfFails =
      benchmarks.cloudflare?.checks?.filter((c) => c.status === "fail") || [];
    for (const fail of cfFails.slice(0, 2)) {
      console.log(
        chalk.dim(`    Cloudflare: ${fail.id}`) +
          chalk.dim(` — see isitagentready.com for fix`),
      );
    }

    const fernFails =
      benchmarks.fern?.checks?.filter(
        (c) => c.status === "fail" || c.status === "warn",
      ) || [];
    if (fernFails.length > 0) {
      console.log(
        chalk.dim(`    Fern: ${fernFails.length} issues`) +
          chalk.dim(` — run npx afdocs ${result.url}`),
      );
    }

    console.log(chalk.dim("\n  Fix, then re-scan to track improvement.\n"));
  }
}

function openInBrowser(filePath) {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${cmd} "${filePath}"`, () => {});
}
