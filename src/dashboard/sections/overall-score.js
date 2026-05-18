export function renderOverallScore(result) {
  const { benchmarks, averageScore } = result;

  let html = `<div id="overall" class="scores">`;

  if (benchmarks.agenticSeo?.available) {
    html += scoreCard(
      "agentic-seo",
      benchmarks.agenticSeo.score,
      100,
      benchmarks.agenticSeo.grade,
    );
  }
  if (benchmarks.cloudflare?.available) {
    html += scoreCard(
      "Cloudflare",
      benchmarks.cloudflare.score,
      benchmarks.cloudflare.maxScore,
      benchmarks.cloudflare.grade,
    );
  }
  if (benchmarks.fern?.available) {
    html += scoreCard(
      "Fern",
      benchmarks.fern.score,
      100,
      benchmarks.fern.grade,
    );
  }

  html += `</div>`;

  const gc =
    averageScore >= 80 ? "grade-a" : averageScore >= 50 ? "grade-c" : "grade-f";
  html += `<div style="text-align:center;margin:16px 0;font-size:14px;color:#8b949e;">Average across sources: <strong class="${gc}">${averageScore}/100</strong></div>`;

  return html;
}

function scoreCard(name, score, maxScore, grade) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const gc = grade
    ? grade.toLowerCase()
    : pct >= 80
      ? "a"
      : pct >= 65
        ? "b"
        : pct >= 50
          ? "c"
          : pct >= 35
            ? "d"
            : "f";

  return `
  <div class="score-card">
    <div class="name">${esc(name)}</div>
    <div class="grade grade-${gc}">${score}/${maxScore}</div>
    <div class="number">${grade || ""}</div>
    <div class="bar"><div class="bar-fill bar-${gc}" style="width:${pct}%"></div></div>
  </div>`;
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
