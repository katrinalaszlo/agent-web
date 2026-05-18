export function renderTrendChart(history) {
  if (!history.scans || history.scans.length < 2) {
    return `<h2 id="trends">Score Trends</h2>\n<p style="color:#8b949e;font-size:13px;">Need at least 2 scans for trend data.</p>`;
  }

  const scans = history.scans.slice(-20);
  const width = 700;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxScore = 100;
  const xStep = scans.length > 1 ? chartW / (scans.length - 1) : chartW;

  function toPoint(index, value) {
    const x = padding.left + index * xStep;
    const y = padding.top + chartH - (value / maxScore) * chartH;
    return { x, y };
  }

  function polyline(values, color) {
    const points = values.map((v, i) => toPoint(i, v));
    const d = points
      .map(
        (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
      )
      .join(" ");
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  function dots(values, color) {
    return values
      .map((v, i) => {
        const p = toPoint(i, v);
        return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="${color}"/>`;
      })
      .join("\n");
  }

  const overall = scans.map((s) => s.score);
  const agent = scans.map((s) => (s.agentReadiness ?? 0) * 2);
  const vis = scans.map((s) => (s.aiVisibility ?? 0) * 2);

  const gridLines = [0, 25, 50, 75, 100]
    .map((v) => {
      const y = padding.top + chartH - (v / maxScore) * chartH;
      return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#21262d" stroke-width="1"/>
<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="#8b949e" font-size="10">${v}</text>`;
    })
    .join("\n");

  const xLabels = scans
    .map((s, i) => {
      if (scans.length <= 10 || i % Math.ceil(scans.length / 8) === 0) {
        const x = padding.left + i * xStep;
        const label = s.timestamp ? s.timestamp.slice(5, 10) : "";
        return `<text x="${x}" y="${height - 5}" text-anchor="middle" fill="#8b949e" font-size="10">${label}</text>`;
      }
      return "";
    })
    .join("\n");

  const svg = `<h2 id="trends">Score Trends</h2>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
${gridLines}
${xLabels}
${polyline(agent, "#79c0ff")}
${polyline(vis, "#d29922")}
${polyline(overall, "#f0f6fc")}
${dots(overall, "#f0f6fc")}
<text x="${width - padding.right}" y="${padding.top - 5}" text-anchor="end" fill="#f0f6fc" font-size="10">Overall</text>
<text x="${width - padding.right - 80}" y="${padding.top - 5}" text-anchor="end" fill="#79c0ff" font-size="10">Agent (x2)</text>
<text x="${width - padding.right - 180}" y="${padding.top - 5}" text-anchor="end" fill="#d29922" font-size="10">Visibility (x2)</text>
</svg>`;

  return svg;
}
