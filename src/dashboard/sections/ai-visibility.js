export function renderAiVisibility(result) {
  return renderScorecard("AI Visibility", result.aiVisibility, "ai-visibility");
}

function renderScorecard(title, scorecard, id) {
  const pct = Math.round((scorecard.score / scorecard.maxScore) * 100);
  const gradeClass =
    pct >= 80
      ? "grade-a"
      : pct >= 60
        ? "grade-b"
        : pct >= 40
          ? "grade-c"
          : "grade-d";

  let html = `<div class="scorecard" id="${id}">
  <div class="scorecard-header">
    <h3>${title}</h3>
    <span class="pct ${gradeClass}">${scorecard.score}/${scorecard.maxScore} (${pct}%)</span>
  </div>`;

  for (const [catName, cat] of Object.entries(scorecard.categories)) {
    const label = formatName(catName);
    const catPct = Math.round((cat.score / cat.maxScore) * 100);
    const barColor =
      catPct >= 80 ? "#3fb950" : catPct >= 50 ? "#d29922" : "#f85149";

    html += `\n  <div class="category">
    <div class="cat-header">
      <span class="cat-name">${label}</span>
      <span class="cat-score">${cat.score}/${cat.maxScore}</span>
      <div class="cat-bar"><div class="cat-bar-fill" style="width:${catPct}%;background:${barColor}"></div></div>
    </div>`;

    for (const check of cat.checks) {
      if (check.passed) {
        html += `\n    <div class="check pass">+ ${check.name} [${check.points}]</div>`;
      } else {
        html += `\n    <div class="check fail">- ${check.name} [${check.points || 0}/${check.maxPoints}]`;
        if (check.fix) {
          html += `<span class="fix">${escapeHtml(check.fix)}</span>`;
        }
        html += `</div>`;
      }
    }

    html += `\n  </div>`;
  }

  html += `\n</div>`;
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
