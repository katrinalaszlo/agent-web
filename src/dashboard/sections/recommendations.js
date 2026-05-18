export function renderRecommendations(result) {
  const failed = [];

  for (const scorecard of [result.agentReadiness, result.aiVisibility]) {
    for (const [catName, cat] of Object.entries(scorecard.categories)) {
      for (const check of cat.checks) {
        if (!check.passed && check.fix) {
          const impact = check.maxPoints - (check.points || 0);
          failed.push({ ...check, category: catName, impact });
        }
      }
    }
  }

  failed.sort((a, b) => b.impact - a.impact);
  const top = failed.slice(0, 8);

  if (top.length === 0) {
    return `<h2 id="recommendations">Recommendations</h2>\n<p style="color:#3fb950;font-size:13px;">All checks passing. Nice.</p>`;
  }

  let html = `<h2 id="recommendations">Top Recommendations</h2>\n<p style="color:#8b949e;font-size:12px;margin-bottom:12px;">Sorted by point impact — fix these first.</p>`;

  for (const rec of top) {
    const category = formatName(rec.category);
    html += `\n<div class="rec">
  <div class="rec-title">${escapeHtml(rec.name)}</div>
  <div class="rec-fix">${escapeHtml(rec.fix)}</div>
  <div class="rec-impact">+${rec.impact} points · ${category}</div>
</div>`;
  }

  return html;
}

function formatName(camelCase) {
  return camelCase
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
