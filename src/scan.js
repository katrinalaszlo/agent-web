import chalk from "chalk";
import { fetchUrl, resolveUrl } from "./utils/fetch.js";
import { detectSiteType } from "./utils/detect-type.js";
import { runDiscoveryChecks } from "./checks/agent-readiness/discovery.js";
import { runContentStructureChecks } from "./checks/agent-readiness/content-structure.js";
import { runCapabilityChecks } from "./checks/agent-readiness/capability.js";
import { runActionableChecks } from "./checks/agent-readiness/actionable.js";
import { runStructuredDataChecks } from "./checks/ai-visibility/structured-data.js";
import { runCitationReadinessChecks } from "./checks/ai-visibility/citation-readiness.js";
import { runAuthorityChecks } from "./checks/ai-visibility/authority.js";
import { runFreshnessChecks } from "./checks/ai-visibility/freshness.js";
import { runAllBenchmarks, printBenchmarks } from "./benchmark/index.js";
import { saveResult } from "./history/index.js";
import { generateDashboard } from "./dashboard/generate.js";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { exec } from "child_process";

export async function scan(opts) {
  const { url, dir, json, benchmark } = opts;
  const mode = url ? "url" : "repo";

  if (!json) {
    console.log(
      chalk.bold("\n  aeo-ready") + chalk.dim(" — AI readiness audit\n"),
    );
  }

  const context = await gatherContext(mode, url, dir);

  if (!json) {
    console.log(chalk.dim(`  Mode: ${mode} | Type: ${context.siteType}\n`));
  }

  const agentReadiness = await runAgentReadinessChecks(context);
  const aiVisibility = await runAiVisibilityChecks(context);

  const score = agentReadiness.score + aiVisibility.score;
  const grade = scoreToGrade(score);

  let benchmarkResult = null;
  if (benchmark) {
    benchmarkResult = await runAllBenchmarks(mode === "url" ? url : dir);
  }

  const result = {
    score,
    grade,
    siteType: context.siteType,
    mode,
    target: url || dir,
    timestamp: new Date().toISOString(),
    agentReadiness,
    aiVisibility,
    benchmarks: benchmarkResult,
  };

  if (!json) {
    printReport(result);
  }

  const baseDir = dir || process.cwd();
  await saveResult(result, baseDir);

  if (!json) {
    const dashPath = await generateDashboard(result, baseDir);
    console.log(chalk.dim(`  Dashboard: ${dashPath}\n`));
    openInBrowser(dashPath);
  }

  return result;
}

async function gatherContext(mode, url, dir) {
  const context = { mode, url, dir, pages: {}, files: [], html: "" };

  if (mode === "url") {
    const homepage = await fetchUrl(url);
    context.html = homepage.text;
    context.pages.home = homepage;

    const fetches = [
      fetchUrl(resolveUrl(url, "/llms.txt")),
      fetchUrl(resolveUrl(url, "/robots.txt")),
      fetchUrl(resolveUrl(url, "/sitemap.xml")),
      fetchUrl(resolveUrl(url, "/.well-known/agent.json")),
      fetchUrl(resolveUrl(url, "/openapi.json")),
    ];

    const [llms, robots, sitemap, agentJson, openapi] =
      await Promise.all(fetches);
    context.pages.llmsTxt = llms;
    context.pages.robotsTxt = robots;
    context.pages.sitemap = sitemap;
    context.pages.agentJson = agentJson;
    context.pages.openapi = openapi;
  } else {
    const fileList = listFiles(dir);
    context.files = fileList;
    context.fileContents = {};
    for (const f of fileList) {
      try {
        context.fileContents[f] = readFileSync(join(dir, f), "utf8");
      } catch {
        /* skip binary/unreadable */
      }
    }
    const indexHtml = [
      "index.html",
      "public/index.html",
      "dist/index.html",
    ].find((p) => existsSync(join(dir, p)));
    if (indexHtml) {
      context.html = readFileSync(join(dir, indexHtml), "utf8");
    }
  }

  context.siteType = detectSiteType({
    html: context.html,
    files: context.files,
    url,
  });

  return context;
}

function listFiles(dir) {
  const skip = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".venv",
    "__pycache__",
    "target",
    ".aeo-ready",
  ]);
  const results = [];

  function walk(current, prefix) {
    let entries;
    try {
      entries = readdirSync(join(dir, current), { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skip.has(entry.name)) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(join(current, entry.name), rel);
      } else {
        results.push(rel);
      }
    }
  }

  walk("", "");
  return results;
}

async function runAgentReadinessChecks(context) {
  const discovery = await runDiscoveryChecks(context);
  const contentStructure = await runContentStructureChecks(context);
  const capability = await runCapabilityChecks(context);
  const actionable = await runActionableChecks(context);

  const score =
    discovery.score +
    contentStructure.score +
    capability.score +
    actionable.score;

  return {
    score,
    maxScore: 50,
    categories: { discovery, contentStructure, capability, actionable },
  };
}

async function runAiVisibilityChecks(context) {
  const structuredData = await runStructuredDataChecks(context);
  const citationReadiness = await runCitationReadinessChecks(context);
  const authority = await runAuthorityChecks(context);
  const freshness = await runFreshnessChecks(context);

  const score =
    structuredData.score +
    citationReadiness.score +
    authority.score +
    freshness.score;

  return {
    score,
    maxScore: 50,
    categories: { structuredData, citationReadiness, authority, freshness },
  };
}

function scoreToGrade(score) {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

function printReport(result) {
  const { score, grade, agentReadiness, aiVisibility, benchmarks } = result;

  const gradeColor =
    grade === "A"
      ? chalk.green
      : grade === "B"
        ? chalk.cyan
        : grade === "C"
          ? chalk.yellow
          : chalk.red;

  console.log(
    `  ${bar(score, 100, 40)}  ${gradeColor.bold(grade)} ${score}/100\n`,
  );

  console.log(
    chalk.dim(
      "  Agent Readiness — can AI agents find, read, and use your site?",
    ),
  );
  console.log(
    chalk.dim(
      "  AI Visibility — how accurately do AI search engines describe you?",
    ),
  );

  if (agentReadiness.score < 25) {
    console.log(
      chalk.dim(
        "\n  Agent Readiness is low — AI engines can't cite what they can't read.",
      ),
    );
    console.log(chalk.dim("  Fix the agent side first. Visibility follows."));
  }
  console.log("");

  printScorecard("Agent Readiness", agentReadiness);
  printScorecard("AI Visibility", aiVisibility);

  const allChecks = [
    ...Object.values(agentReadiness.categories),
    ...Object.values(aiVisibility.categories),
  ].flatMap((c) => c.checks);
  const passed = allChecks.filter((c) => c.passed).length;
  const failed = allChecks.filter((c) => !c.passed && c.points === 0).length;
  const partial = allChecks.length - passed - failed;

  console.log(
    chalk.dim(
      `  ${chalk.green(passed + " passed")} · ${partial ? chalk.yellow(partial + " partial") + " · " : ""}${chalk.red(failed + " failed")} · ${allChecks.length} checks total\n`,
    ),
  );

  if (benchmarks) {
    printBenchmarks(benchmarks);
  }
}

function printScorecard(name, scorecard) {
  const pct = Math.round((scorecard.score / scorecard.maxScore) * 100);
  console.log(
    chalk.bold(`  ${name}`) +
      chalk.dim(` ${scorecard.score}/${scorecard.maxScore} (${pct}%)`),
  );

  for (const [catName, cat] of Object.entries(scorecard.categories)) {
    const label = formatCategoryName(catName);
    const catPct = Math.round((cat.score / cat.maxScore) * 100);
    const icon =
      catPct >= 80
        ? chalk.green("✓")
        : catPct >= 40
          ? chalk.yellow("◑")
          : chalk.red("✗");
    console.log(
      `  ${icon} ${label.padEnd(28)} ${bar(cat.score, cat.maxScore, 20)} ${chalk.dim(`${cat.score}/${cat.maxScore} (${catPct}%)`)}`,
    );

    for (const check of cat.checks) {
      if (check.passed) {
        console.log(
          chalk.green(`      +`) +
            chalk.dim(` ${check.name} [${check.points}]`),
        );
      } else {
        console.log(
          chalk.red(`      -`) +
            ` ${check.name} ` +
            chalk.dim(`[${check.points || 0}/${check.maxPoints}]`),
        );
        if (check.fix) {
          console.log(chalk.dim(`        ${check.fix}`));
        }
      }
    }
  }
  console.log("");
}

function bar(value, max, width) {
  const filled = max > 0 ? Math.round((value / max) * width) : 0;
  const empty = width - filled;
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct >= 80 ? chalk.green : pct >= 50 ? chalk.yellow : chalk.red;
  return color("█".repeat(filled)) + chalk.dim("░".repeat(empty));
}

function formatCategoryName(camelCase) {
  return camelCase
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
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
