export function renderOverallScore(result, beforeResult) {
  if (beforeResult) {
    return renderBeforeAfter(beforeResult, result);
  }
  return renderSingle(result);
}

function renderSingle(result) {
  const { score, grade } = result;
  const gradeClass = `grade-${grade.toLowerCase()}`;
  const barClass = `bar-${grade.toLowerCase()}`;

  return `<div class="score-hero" id="overall">
  <div class="grade ${gradeClass}">${grade}</div>
  <div class="number">${score} / 100</div>
  <div class="bar"><div class="bar-fill ${barClass}" style="width:${score}%"></div></div>
  <div style="display:flex;justify-content:center;gap:40px;margin-top:16px;font-size:13px;">
    <span>Agent Readiness: <strong>${result.agentReadiness.score}/50</strong></span>
    <span>AI Visibility: <strong>${result.aiVisibility.score}/50</strong></span>
  </div>
</div>
${renderInsight(result)}
${renderBenchmarkComparison(score)}`;
}

function renderBeforeAfter(before, after) {
  const delta = after.score - before.score;
  const deltaClass = delta > 0 ? "trend" : delta < 0 ? "regression" : "";
  const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;

  return `<div id="overall" style="display:flex;align-items:center;justify-content:center;gap:24px;padding:32px 0;">

  <div style="text-align:center;flex:1;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#8b949e;margin-bottom:8px;">Before</div>
    <div class="grade-${before.grade.toLowerCase()}" style="font-size:48px;font-weight:700;">${before.grade}</div>
    <div style="font-size:20px;color:#8b949e;margin-top:4px;">${before.score} / 100</div>
    <div class="bar" style="margin:12px auto;width:200px;height:6px;background:#21262d;border-radius:3px;overflow:hidden;">
      <div class="bar-fill bar-${before.grade.toLowerCase()}" style="width:${before.score}%;height:100%;border-radius:3px;"></div>
    </div>
    <div style="font-size:12px;color:#8b949e;">
      Agent: ${before.agentReadiness.score}/50 · Visibility: ${before.aiVisibility.score}/50
    </div>
  </div>

  <div style="font-size:32px;color:#8b949e;padding:0 8px;">→</div>

  <div style="text-align:center;flex:1;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#8b949e;margin-bottom:8px;">After</div>
    <div class="grade-${after.grade.toLowerCase()}" style="font-size:48px;font-weight:700;">${after.grade}</div>
    <div style="font-size:20px;color:#8b949e;margin-top:4px;">${after.score} / 100</div>
    <div class="bar" style="margin:12px auto;width:200px;height:6px;background:#21262d;border-radius:3px;overflow:hidden;">
      <div class="bar-fill bar-${after.grade.toLowerCase()}" style="width:${after.score}%;height:100%;border-radius:3px;"></div>
    </div>
    <div style="font-size:12px;color:#8b949e;">
      Agent: ${after.agentReadiness.score}/50 · Visibility: ${after.aiVisibility.score}/50
    </div>
  </div>

</div>
${delta !== 0 ? `<div style="text-align:center;margin-top:-16px;margin-bottom:16px;"><span class="${deltaClass}" style="font-size:16px;font-weight:600;">${deltaStr} points</span></div>` : ""}
${renderInsight(after)}
${renderBenchmarkComparison(after.score)}`;
}

function renderInsight(result) {
  const agent = result.agentReadiness.score;
  const vis = result.aiVisibility.score;

  if (agent < 25) {
    return `<div style="text-align:center;padding:12px 24px;margin:16px auto;max-width:500px;background:#d2992210;border:1px solid #d2992233;border-radius:6px;font-size:13px;color:#d29922;">
  <strong>Agent Readiness is low.</strong> AI engines can't cite what they can't read.<br>
  <span style="color:#8b949e;">Fix the agent side first. Visibility follows.</span>
</div>`;
  }

  if (agent >= 40 && vis < 25) {
    return `<div style="text-align:center;padding:12px 24px;margin:16px auto;max-width:500px;background:#79c0ff10;border:1px solid #79c0ff33;border-radius:6px;font-size:13px;color:#79c0ff;">
  <strong>Agents can read your site — now make it citable.</strong><br>
  <span style="color:#8b949e;">Add direct answer summaries, question headings, and structured claims.</span>
</div>`;
  }

  if (agent >= 40 && vis >= 40) {
    return `<div style="text-align:center;padding:12px 24px;margin:16px auto;max-width:500px;background:#3fb95010;border:1px solid #3fb95033;border-radius:6px;font-size:13px;color:#3fb950;">
  <strong>Strong on both sides.</strong> Agents can find you and AI engines can cite you.
</div>`;
  }

  return "";
}

const REFERENCE_SCORES = [
  { name: "Stripe", score: 33, type: "SaaS" },
  { name: "Anthropic Docs", score: 43, type: "API" },
  { name: "Vercel", score: 48, type: "SaaS" },
  { name: "Supabase", score: 52, type: "API" },
  { name: "Cloudflare", score: 55, type: "SaaS" },
  { name: "Average site", score: 25, type: "" },
];

function renderBenchmarkComparison(yourScore) {
  const sorted = [
    ...REFERENCE_SCORES,
    { name: "You", score: yourScore, type: "", you: true },
  ].sort((a, b) => b.score - a.score);

  let html = `<div style="margin-top:24px;padding:20px;background:#161b22;border:1px solid #21262d;border-radius:8px;">
  <div style="font-size:13px;font-weight:600;color:#f0f6fc;margin-bottom:12px;">How you compare</div>`;

  for (const entry of sorted) {
    const isYou = entry.you;
    const color = isYou ? "#d29922" : "#30363d";
    const nameColor = isYou ? "#f0f6fc" : "#8b949e";
    const weight = isYou ? "font-weight:600;" : "";

    html += `
  <div style="display:flex;align-items:center;gap:8px;margin:6px 0;">
    <span style="width:120px;font-size:12px;color:${nameColor};${weight}">${entry.name}</span>
    <div style="flex:1;height:4px;background:#21262d;border-radius:2px;overflow:hidden;">
      <div style="width:${entry.score}%;height:100%;background:${color};border-radius:2px;"></div>
    </div>
    <span style="font-size:11px;color:${nameColor};width:32px;text-align:right;${weight}">${entry.score}</span>
  </div>`;
  }

  html += `\n</div>`;
  return html;
}
