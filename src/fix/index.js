import chalk from "chalk";
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { generateRobotsTxt } from "./generators/robots-txt.js";
import { generateAgentsJson } from "./generators/agents-json.js";
import { generateLlmsTxt } from "./generators/llms-txt.js";
import { generateAgentsMd } from "./generators/agents-md.js";
import { generateDashboard } from "../dashboard/generate.js";

export async function fix(beforeResult, dir, rescanFn) {
  const failedChecks = getAllFailedChecks(beforeResult);
  const applied = [];
  const manual = [];

  for (const check of failedChecks) {
    const result = await generateFix(check, beforeResult, dir);
    if (result) {
      if (result.draft) {
        manual.push(result);
      } else {
        writeFix(result, dir);
        applied.push(result);
      }
    } else {
      manual.push({ description: check.fix, name: check.name });
    }
  }

  const afterResult = rescanFn ? await rescanFn() : null;

  printSummary(beforeResult, afterResult, applied, manual);

  if (afterResult && dir) {
    const dashPath = await generateDashboard(afterResult, dir, {
      beforeResult,
    });
    console.log(chalk.dim(`  Dashboard: ${dashPath}\n`));
  }

  return { applied, manual, afterResult };
}

function printSummary(before, after, applied, manual) {
  const beforeScore = before.score;
  const afterScore = after ? after.score : null;

  console.log(chalk.bold("\n  agent-web --fix\n"));

  if (afterScore !== null) {
    const delta = afterScore - beforeScore;
    const deltaStr =
      delta > 0
        ? chalk.green(` (+${delta})`)
        : delta < 0
          ? chalk.red(` (${delta})`)
          : "";
    const beforeGrade = gradeColor(before.grade)(`${beforeScore}`);
    const afterGrade = gradeColor(after.grade)(`${afterScore}`);
    console.log(
      `  ${beforeGrade}${chalk.dim("/100")} ${chalk.dim("->")} ${afterGrade}${chalk.dim("/100")}${deltaStr}\n`,
    );

    const bA = before.agentReadiness.score;
    const bV = before.aiVisibility.score;
    const aA = after.agentReadiness.score;
    const aV = after.aiVisibility.score;
    const dA = aA - bA;
    const dV = aV - bV;
    const fmtDelta = (d) =>
      d > 0 ? chalk.green(`+${d}`) : d < 0 ? chalk.red(`${d}`) : chalk.dim("—");

    console.log(
      chalk.dim("  Agent Readiness  ") +
        `${bA} -> ${aA} ${fmtDelta(dA)}` +
        chalk.dim("  can agents find, read, and use your site?"),
    );
    console.log(
      chalk.dim("  AI Visibility    ") +
        `${bV} -> ${aV} ${fmtDelta(dV)}` +
        chalk.dim("  how accurately do AI engines describe you?"),
    );

    if (bA < 25) {
      console.log(
        chalk.dim(
          "\n  Agent Readiness is low — AI engines can't cite what they can't read.",
        ),
      );
      console.log(chalk.dim("  Fix the agent side first. Visibility follows."));
    }
  } else {
    console.log(
      `  ${chalk.dim("Score:")} ${beforeScore}/100 (${before.grade})\n`,
    );
  }

  if (applied.length > 0) {
    console.log(chalk.bold("\n  We fixed:"));
    for (const fix of applied) {
      console.log(
        chalk.green(`    + ${fix.file}`) + chalk.dim(` — ${fix.description}`),
      );
    }
  }

  const humanTasks = manual.filter((m) => m.description);
  if (humanTasks.length > 0) {
    console.log(chalk.bold("\n  You still need to:"));
    for (const task of humanTasks.slice(0, 6)) {
      console.log(chalk.dim(`    - ${task.description}`));
    }
    if (humanTasks.length > 6) {
      console.log(chalk.dim(`    ... and ${humanTasks.length - 6} more`));
    }
  }

  console.log("");
}

function writeFix(fix, dir) {
  const filePath = join(dir, fix.file);
  const fileDir = dirname(filePath);
  if (!existsSync(fileDir)) mkdirSync(fileDir, { recursive: true });

  if (existsSync(filePath) && fix.merge) {
    const existing = readFileSync(filePath, "utf8");
    const merged = fix.merge(existing, fix.content);
    writeFileSync(filePath, merged);
  } else {
    writeFileSync(filePath, fix.content);
  }
}

async function generateFix(check, scanResult, dir) {
  switch (check.name) {
    case "robots.txt AI crawlers":
      return generateRobotsTxt(check, scanResult, dir);
    case "agents.json manifest":
      return generateAgentsJson(check, scanResult, dir);
    case "AGENTS.md / CLAUDE.md":
      return generateAgentsMd(check, scanResult, dir);
    case "llms.txt":
      return generateLlmsTxt(check, scanResult, dir);
    default:
      return null;
  }
}

function getAllFailedChecks(scanResult) {
  const checks = [];
  for (const scorecard of [
    scanResult.agentReadiness,
    scanResult.aiVisibility,
  ]) {
    for (const cat of Object.values(scorecard.categories)) {
      for (const check of cat.checks) {
        if (!check.passed) {
          checks.push(check);
        }
      }
    }
  }
  return checks;
}

function gradeColor(grade) {
  switch (grade) {
    case "A":
      return chalk.green;
    case "B":
      return chalk.cyan;
    case "C":
      return chalk.yellow;
    default:
      return chalk.red;
  }
}
