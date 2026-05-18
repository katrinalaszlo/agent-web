export function renderTrendChart(history) {
  if (!history.scans || history.scans.length < 2) {
    return `<h2 id="trends">Score Trends</h2>\n<p style="color:#8b949e;font-size:13px;">Need at least 2 scans for trend data.</p>`;
  }

  const scans = history.scans.slice(-20);
  const width = 700;
  const height = 200;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const xStep = scans.length > 1 ? chartW / (scans.length - 1) : chartW;

  function toY(value) {
    return pad.top + chartH - (value / 100) * chartH;
  }

  function polyline(values, color) {
    const pts = values.map(
      (v, i) =>
        `${i === 0 ? "M" : "L"} ${(pad.left + i * xStep).toFixed(1)} ${toY(v ?? 0).toFixed(1)}`,
    );
    return `<path d="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  const agenticSeo = scans.map((s) => s.agenticSeo ?? 0);
  const cloudflare = scans.map((s) =>
    s.cloudflare != null && s.cloudflareMax
      ? Math.round((s.cloudflare / s.cloudflareMax) * 100)
      : 0,
  );
  const fern = scans.map((s) => s.fern ?? 0);

  const grid = [0, 25, 50, 75, 100]
    .map((v) => {
      const y = toY(v);
      return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="#21262d"/><text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" fill="#8b949e" font-size="10">${v}</text>`;
    })
    .join("\n");

  const labels = scans
    .map((s, i) => {
      if (scans.length <= 10 || i % Math.ceil(scans.length / 8) === 0) {
        const x = pad.left + i * xStep;
        const label = s.timestamp ? s.timestamp.slice(5, 10) : "";
        return `<text x="${x}" y="${height - 5}" text-anchor="middle" fill="#8b949e" font-size="10">${label}</text>`;
      }
      return "";
    })
    .join("\n");

  return `<h2 id="trends">Score Trends</h2>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
${grid}
${labels}
${polyline(agenticSeo, "#f85149")}
${polyline(cloudflare, "#3fb950")}
${polyline(fern, "#79c0ff")}
<text x="${width - pad.right}" y="${pad.top - 5}" text-anchor="end" fill="#f85149" font-size="10">agentic-seo</text>
<text x="${width - pad.right - 90}" y="${pad.top - 5}" text-anchor="end" fill="#3fb950" font-size="10">Cloudflare</text>
<text x="${width - pad.right - 170}" y="${pad.top - 5}" text-anchor="end" fill="#79c0ff" font-size="10">Fern</text>
</svg>`;
}
