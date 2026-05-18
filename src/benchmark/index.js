import chalk from "chalk";
import { runBenchmark as runAgenticSeo } from "./agentic-seo.js";
import { runCloudflare } from "./cloudflare.js";
import { runFern } from "./fern.js";

const REFERENCE_SCORES = {
  agenticSeo: {
    Stripe: 17,
    Vercel: 48,
    Supabase: 52,
    Cloudflare: 55,
    Average: 25,
  },
  cloudflare: {
    Stripe: 2,
    Vercel: 4,
    Supabase: 3,
    Cloudflare: 5,
    Average: 2,
  },
  fern: {
    Stripe: 85,
    Vercel: 60,
    Supabase: 78,
    Anthropic: 72,
    Average: 45,
  },
};

export async function runAllBenchmarks(target, dir) {
  const isUrl = target && target.startsWith("http");

  const results = await Promise.allSettled([
    runAgenticSeo(dir || target),
    isUrl ? runCloudflare(target) : Promise.resolve(null),
    isUrl ? runFern(target) : Promise.resolve(null),
  ]);

  return {
    agenticSeo: results[0].status === "fulfilled" ? results[0].value : null,
    cloudflare: results[1].status === "fulfilled" ? results[1].value : null,
    fern: results[2].status === "fulfilled" ? results[2].value : null,
  };
}

export function printBenchmarks(benchmarks) {
  const any = Object.values(benchmarks).some((b) => b && b.available);
  if (!any) return;

  console.log(
    chalk.bold("\n  ─── Benchmarks ────────────────────────────────────\n"),
  );

  if (benchmarks.agenticSeo?.available) {
    printBenchmarkBlock("agentic-seo", "agenticSeo", benchmarks.agenticSeo);
  }
  if (benchmarks.cloudflare?.available) {
    printBenchmarkBlock("Cloudflare", "cloudflare", benchmarks.cloudflare);
  }
  if (benchmarks.fern?.available) {
    printBenchmarkBlock("Fern", "fern", benchmarks.fern);
  }
}

function printBenchmarkBlock(name, key, b) {
  const pct = b.maxScore > 0 ? Math.round((b.score / b.maxScore) * 100) : 0;
  const color = pct >= 80 ? chalk.green : pct >= 50 ? chalk.yellow : chalk.red;
  const barW = 16;
  const filled = Math.round((pct / 100) * barW);
  const bar = color("█".repeat(filled)) + chalk.dim("░".repeat(barW - filled));

  console.log(
    `  ${bar} ${chalk.bold(name.padEnd(16))} ${chalk.dim(`${b.score}/${b.maxScore}`)}${b.grade ? chalk.dim(` (${b.grade})`) : ""}`,
  );

  if (b.checks && b.checks.length > 0) {
    for (const check of b.checks) {
      if (check.status === "pass") {
        console.log(
          chalk.green(`    + ${check.id}`) +
            chalk.dim(check.message ? ` ${check.message.slice(0, 60)}` : ""),
        );
      } else if (check.status === "fail") {
        console.log(
          chalk.red(`    - ${check.id}`) +
            chalk.dim(check.message ? ` ${check.message.slice(0, 60)}` : ""),
        );
      }
    }
  } else if (b.categories) {
    for (const [, cat] of Object.entries(b.categories)) {
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
          `    ${icon} ${(cat.name || "").padEnd(22)} ${cat.score}/${cat.maxScore}`,
        ),
      );
    }
  }

  const refs = REFERENCE_SCORES[key];
  if (refs) {
    const names = Object.entries(refs)
      .sort((a, b) => b[1] - a[1])
      .map(([n, s]) => `${n} ${s}`)
      .join(chalk.dim(" · "));
    console.log(chalk.dim(`    compare: ${names}`));
  }

  console.log("");
}
