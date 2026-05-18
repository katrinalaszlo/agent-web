import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { getHistory } from "../history/index.js";
import { renderOverallScore } from "./sections/overall-score.js";
import { renderHistoryTable } from "./sections/history-table.js";
import { renderTrendChart } from "./sections/trend-chart.js";
import { renderBenchmarkDetails } from "./sections/benchmark-details.js";

const DASHBOARD_DIR = ".aeo-ready";
const DASHBOARD_FILE = "dashboard.html";

export async function generateDashboard(scanResult, dir, opts = {}) {
  const dashDir = join(dir, DASHBOARD_DIR);
  if (!existsSync(dashDir)) mkdirSync(dashDir, { recursive: true });

  const dashPath = join(dashDir, DASHBOARD_FILE);
  const history = getHistory(dir);

  const sections = {
    "overall-score": renderOverallScore(scanResult),
    "benchmark-details": renderBenchmarkDetails(scanResult),
    "trend-chart": renderTrendChart(history),
    "history-table": renderHistoryTable(history),
  };

  let html;
  if (existsSync(dashPath)) {
    html = readFileSync(dashPath, "utf8");
    for (const [name, content] of Object.entries(sections)) {
      html = replaceSection(html, name, content);
    }
  } else {
    html = buildFullDashboard(sections, scanResult);
  }

  writeFileSync(dashPath, html);
  return dashPath;
}

function replaceSection(html, name, content) {
  const regex = new RegExp(
    `(<!-- SECTION:${name} -->)[\\s\\S]*?(<!-- /SECTION:${name} -->)`,
    "g",
  );
  if (regex.test(html)) {
    return html.replace(regex, `$1\n${content}\n$2`);
  }
  return html;
}

function buildFullDashboard(sections, scanResult) {
  const timestamp = new Date().toISOString().slice(0, 10);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>aeo-ready — AEO Benchmark Dashboard</title>
<style>
${CSS}
</style>
</head>
<body>

<nav>
  <h2>aeo-ready</h2>
  <a href="#overall" class="section-head">Scores</a>
  <a href="#details" class="section-head">Benchmark Details</a>
  <a href="#trends" class="section-head">Trends</a>
  <a href="#history" class="section-head">History</a>
</nav>

<main>

<h1>AEO Benchmark Dashboard</h1>
<p class="subtitle">${scanResult.url} · ${timestamp}</p>

<!-- SECTION:overall-score -->
${sections["overall-score"]}
<!-- /SECTION:overall-score -->

<!-- SECTION:benchmark-details -->
${sections["benchmark-details"]}
<!-- /SECTION:benchmark-details -->

<!-- SECTION:trend-chart -->
${sections["trend-chart"]}
<!-- /SECTION:trend-chart -->

<!-- SECTION:history-table -->
${sections["history-table"]}
<!-- /SECTION:history-table -->

</main>
</body>
</html>`;
}

const CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; display: flex; }
nav { position: fixed; top: 0; left: 0; width: 200px; height: 100vh; background: #010409; border-right: 1px solid #21262d; padding: 0; overflow-y: auto; z-index: 10; }
nav h2 { color: #f0f6fc; font-size: 13px; letter-spacing: 0.02em; padding: 20px 16px 14px; border-bottom: 1px solid #21262d; margin: 0 0 8px; }
nav a { display: block; padding: 6px 16px; font-size: 12px; color: #8b949e; text-decoration: none; transition: color 0.15s; }
nav a:hover { color: #f0f6fc; }
nav a.section-head { color: #c9d1d9; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 12px; }
main { margin-left: 200px; padding: 32px 40px; max-width: 900px; width: 100%; }
h1 { color: #f0f6fc; font-size: 24px; margin-bottom: 4px; }
.subtitle { color: #8b949e; font-size: 13px; margin-bottom: 32px; }
h2 { color: #f0f6fc; font-size: 18px; margin-top: 40px; margin-bottom: 16px; padding-top: 16px; border-top: 1px solid #21262d; }
h3 { color: #f0f6fc; font-size: 14px; margin-top: 16px; margin-bottom: 8px; }
.scores { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; }
.score-card { background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 20px; flex: 1; min-width: 180px; text-align: center; }
.score-card .name { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #8b949e; margin-bottom: 8px; }
.score-card .grade { font-size: 36px; font-weight: 700; }
.score-card .number { font-size: 14px; color: #8b949e; margin-top: 4px; }
.score-card .bar { margin: 8px auto; width: 100%; height: 4px; background: #21262d; border-radius: 2px; overflow: hidden; }
.score-card .bar-fill { height: 100%; border-radius: 2px; }
.grade-a { color: #3fb950; } .grade-b { color: #79c0ff; } .grade-c { color: #d29922; } .grade-d { color: #f85149; } .grade-f { color: #f85149; }
.bar-a { background: #3fb950; } .bar-b { background: #79c0ff; } .bar-c { background: #d29922; } .bar-d { background: #f85149; } .bar-f { background: #f85149; }
details { background: #161b22; border: 1px solid #21262d; border-radius: 8px; padding: 16px; margin: 12px 0; cursor: pointer; }
details summary { font-size: 14px; font-weight: 500; color: #f0f6fc; display: flex; justify-content: space-between; }
.check { font-size: 12px; padding: 2px 0 2px 16px; color: #8b949e; }
.check.pass { color: #3fb950; }
.check.fail { color: #f85149; }
.compare { font-size: 11px; color: #8b949e; margin-top: 8px; padding-top: 8px; border-top: 1px solid #21262d; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; }
th, td { text-align: left; padding: 8px 12px; font-size: 12px; border-bottom: 1px solid #21262d; }
th { color: #8b949e; font-weight: 600; }
.trend { color: #3fb950; } .regression { color: #f85149; }
svg { display: block; margin: 16px 0; }`;
