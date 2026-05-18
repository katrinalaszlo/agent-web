import { estimateTokens, TOKEN_BUDGETS } from "../../utils/tokens.js";

export async function runContentStructureChecks(context) {
  const checks = [
    checkMarkdownAvailability(context),
    checkHeadingHierarchy(context),
    checkTokenBudgets(context),
    checkFrontLoading(context),
    checkCopyForAi(context),
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  return { score, maxScore: 15, checks };
}

function checkMarkdownAvailability(context) {
  if (context.mode === "url") {
    const html = context.html || "";
    const hasMarkdownLink =
      html.includes(".md") || html.includes("text/markdown");
    return hasMarkdownLink
      ? pass("Markdown content available", 3)
      : fail(
          "Markdown content available",
          3,
          "No markdown versions of content detected. Serve .md files or support Accept: text/markdown.",
        );
  }

  const mdFiles = context.files.filter((f) => f.endsWith(".md"));
  if (mdFiles.length === 0) {
    return fail(
      "Markdown content available",
      3,
      "No markdown files found in project.",
    );
  }
  if (mdFiles.length >= 3) return pass("Markdown content available", 3);
  return partial(
    "Markdown content available",
    2,
    3,
    `Only ${mdFiles.length} markdown files. More content should be in .md format.`,
  );
}

function checkHeadingHierarchy(context) {
  const content = getAllTextContent(context);
  if (!content) {
    return fail(
      "Heading hierarchy",
      3,
      "No content available to analyze headings.",
    );
  }

  const headings = extractHeadings(content);
  if (headings.length === 0) {
    return fail("Heading hierarchy", 3, "No headings found in content.");
  }

  const hasH1 = headings.some((h) => h.level === 1);
  const hierarchyValid = checkHierarchyOrder(headings);
  const noSkips = !hasLevelSkips(headings);

  let points = 0;
  if (hasH1) points += 1;
  if (hierarchyValid) points += 1;
  if (noSkips) points += 1;

  if (points === 3) return pass("Heading hierarchy", 3);
  const issues = [];
  if (!hasH1) issues.push("no H1");
  if (!hierarchyValid) issues.push("inconsistent hierarchy");
  if (!noSkips) issues.push("skipped heading levels");
  return partial(
    "Heading hierarchy",
    points,
    3,
    `Heading issues: ${issues.join(", ")}.`,
  );
}

function checkTokenBudgets(context) {
  const content = getAllTextContent(context);
  if (!content) {
    return fail(
      "Token budget compliance",
      4,
      "No content to measure token counts.",
    );
  }

  const pages = getPageContents(context);
  if (pages.length === 0) {
    return partial(
      "Token budget compliance",
      2,
      4,
      "Could not identify individual pages to check budgets.",
    );
  }

  const overBudget = pages.filter((p) => estimateTokens(p.content) > 25000);
  const avgTokens =
    pages.reduce((sum, p) => sum + estimateTokens(p.content), 0) / pages.length;

  if (overBudget.length === 0 && avgTokens < 15000)
    return pass("Token budget compliance", 4);
  if (overBudget.length === 0)
    return partial(
      "Token budget compliance",
      3,
      4,
      `Average page is ${Math.round(avgTokens)} tokens. Under 15K is ideal.`,
    );
  return partial(
    "Token budget compliance",
    1,
    4,
    `${overBudget.length} pages exceed 25K token budget.`,
  );
}

function checkFrontLoading(context) {
  const pages = getPageContents(context);
  if (pages.length === 0) {
    return fail(
      "Front-loading (first 500 tokens)",
      3,
      "No pages to analyze for front-loading.",
    );
  }

  let frontLoaded = 0;
  for (const page of pages.slice(0, 10)) {
    const first2000Chars = page.content.slice(0, 2000);
    const hasWhat = /\b(what|is|does|provides?|offers?)\b/i.test(
      first2000Chars,
    );
    const hasWhy = /\b(why|because|benefit|solves?|helps?)\b/i.test(
      first2000Chars,
    );
    if (hasWhat && hasWhy) frontLoaded++;
  }

  const ratio = frontLoaded / Math.min(pages.length, 10);
  if (ratio >= 0.8) return pass("Front-loading (first 500 tokens)", 3);
  if (ratio >= 0.5)
    return partial(
      "Front-loading (first 500 tokens)",
      2,
      3,
      `Only ${Math.round(ratio * 100)}% of pages front-load what/why in first 500 tokens.`,
    );
  return partial(
    "Front-loading (first 500 tokens)",
    1,
    3,
    `Most pages don\'t answer what/why/how in first 500 tokens. Lead with the point.`,
  );
}

function checkCopyForAi(context) {
  const html = context.html || "";
  const files = context.files || [];

  const hasCopyButton =
    html.includes("copy") &&
    (html.includes("markdown") || html.includes("clipboard"));
  const hasMarkdownExport = files.some(
    (f) => f.includes("export") && f.endsWith(".md"),
  );

  if (hasCopyButton) return pass("Copy-for-AI affordances", 2);
  if (hasMarkdownExport)
    return partial(
      "Copy-for-AI affordances",
      1,
      2,
      "Markdown export exists but no copy-as-markdown button detected.",
    );
  return fail(
    "Copy-for-AI affordances",
    2,
    'No copy-for-AI affordances. Add a "Copy as Markdown" button on doc pages.',
  );
}

function getAllTextContent(context) {
  if (context.mode === "url") return context.html || "";
  const textFiles = context.files.filter(
    (f) => f.endsWith(".md") || f.endsWith(".html") || f.endsWith(".txt"),
  );
  return textFiles.map((f) => context.fileContents[f] || "").join("\n");
}

function getPageContents(context) {
  if (context.mode === "url") {
    return context.html ? [{ name: "homepage", content: context.html }] : [];
  }
  return context.files
    .filter((f) => f.endsWith(".md") || f.endsWith(".html"))
    .map((f) => ({ name: f, content: context.fileContents[f] || "" }))
    .filter((p) => p.content.length > 0);
}

function extractHeadings(content) {
  const mdHeadings = [...content.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((m) => ({
    level: m[1].length,
    text: m[2],
  }));
  const htmlHeadings = [...content.matchAll(/<h([1-6])[^>]*>([^<]+)/gi)].map(
    (m) => ({ level: parseInt(m[1]), text: m[2] }),
  );
  return mdHeadings.length > htmlHeadings.length ? mdHeadings : htmlHeadings;
}

function checkHierarchyOrder(headings) {
  if (headings.length < 2) return true;
  const firstLevel = headings[0].level;
  return headings.slice(1).every((h) => h.level >= firstLevel);
}

function hasLevelSkips(headings) {
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level - headings[i - 1].level > 1) return true;
  }
  return false;
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
