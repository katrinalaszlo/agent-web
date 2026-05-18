export async function runFreshnessChecks(context) {
  const checks = [
    checkModifiedDates(context),
    checkPublicationCadence(context),
    checkContentRecency(context),
    checkEvergreenFlags(context),
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  return { score, maxScore: 10, checks };
}

function checkModifiedDates(context) {
  const allContent = getAllContent(context);
  const html = context.html || "";

  const hasDateModified = /dateModified|lastmod|last.modified|updated/i.test(
    allContent,
  );
  const hasDatePublished = /datePublished|pubdate|published/i.test(allContent);
  const hasMetaDate = /article:modified_time|article:published_time/i.test(
    html,
  );

  let points = 0;
  if (hasDateModified || hasMetaDate) points += 2;
  if (hasDatePublished) points += 1;

  if (points === 3) return pass("Last modified dates", 3);
  if (points > 0) {
    const missing = [];
    if (!hasDateModified && !hasMetaDate) missing.push("dateModified");
    if (!hasDatePublished) missing.push("datePublished");
    return partial(
      "Last modified dates",
      points,
      3,
      `Add ${missing.join(" and ")} to structured data. AI systems prioritize fresh content.`,
    );
  }
  return fail(
    "Last modified dates",
    3,
    "No date metadata found. Add dateModified and datePublished to structured data or meta tags.",
  );
}

function checkPublicationCadence(context) {
  const allContent = getAllContent(context);

  const dates = extractDates(allContent);
  if (dates.length < 2) {
    return partial(
      "Publication cadence",
      1,
      2,
      "Not enough dated content to assess publication cadence.",
    );
  }

  const sorted = dates.sort((a, b) => b - a);
  const gaps = [];
  for (let i = 0; i < Math.min(sorted.length - 1, 5); i++) {
    gaps.push(sorted[i] - sorted[i + 1]);
  }
  const avgGapDays =
    gaps.reduce((s, g) => s + g, 0) / gaps.length / (1000 * 60 * 60 * 24);

  if (avgGapDays <= 30) return pass("Publication cadence", 2);
  if (avgGapDays <= 90)
    return partial(
      "Publication cadence",
      1,
      2,
      `Average ${Math.round(avgGapDays)} days between publications. Monthly or better signals active maintenance.`,
    );
  return fail(
    "Publication cadence",
    2,
    `Infrequent updates (~${Math.round(avgGapDays)} day gaps). Regular publishing signals authority to AI systems.`,
  );
}

function checkContentRecency(context) {
  const allContent = getAllContent(context);
  const dates = extractDates(allContent);

  if (dates.length === 0) {
    return fail("Content recency", 3, "No dates found to assess content age.");
  }

  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  const recentDates = dates.filter((d) => now - d < oneYear);
  const ratio = recentDates.length / dates.length;

  if (ratio >= 0.5) return pass("Content recency", 3);
  if (ratio >= 0.2)
    return partial(
      "Content recency",
      2,
      3,
      `Only ${Math.round(ratio * 100)}% of dated content is from the last 12 months.`,
    );
  return partial(
    "Content recency",
    1,
    3,
    "Most content appears older than 12 months. Update key pages or add new content.",
  );
}

function checkEvergreenFlags(context) {
  const allContent = getAllContent(context);

  const hasEvergreen = /evergreen|timeless|guide|reference|documentation/i.test(
    allContent,
  );
  const hasVersioning = /v\d|version \d|updated for \d{4}|as of \d{4}/i.test(
    allContent,
  );

  if (hasEvergreen && hasVersioning)
    return pass("Evergreen content flagged", 2);
  if (hasEvergreen || hasVersioning)
    return partial(
      "Evergreen content flagged",
      1,
      2,
      'Some content signals permanence. Add "Updated for 2026" or version markers to evergreen pieces.',
    );
  return fail(
    "Evergreen content flagged",
    2,
    "No evergreen content markers. Flag reference content as timeless so AI doesn't deprioritize it for age.",
  );
}

function extractDates(content) {
  const patterns = [
    /\d{4}-\d{2}-\d{2}/g,
    /\d{4}\/\d{2}\/\d{2}/g,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}/gi,
  ];

  const dates = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const d = new Date(match[0]);
      if (
        !isNaN(d.getTime()) &&
        d.getFullYear() >= 2015 &&
        d.getFullYear() <= 2030
      ) {
        dates.push(d.getTime());
      }
    }
  }
  return [...new Set(dates)];
}

function getAllContent(context) {
  if (context.mode === "url") {
    return Object.values(context.pages || {})
      .map((p) => p?.text || "")
      .join("\n");
  }
  return Object.values(context.fileContents || {}).join("\n");
}

function pass(name, points) {
  return { name, passed: true, points, maxPoints: points };
}

function partial(name, points, maxPoints, fix) {
  return { name, passed: false, points, maxPoints, fix };
}

function fail(name, maxPoints, fix) {
  return { name, passed: false, points: 0, maxPoints, fix };
}
