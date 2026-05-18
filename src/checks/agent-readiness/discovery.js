import { estimateTokens } from "../../utils/tokens.js";

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "Google-Extended",
  "PerplexityBot",
  "Meta-ExternalAgent",
  "CCBot",
];

export async function runDiscoveryChecks(context) {
  const checks = [
    checkLlmsTxt(context),
    checkRobotsTxt(context),
    checkSitemap(context),
    checkAiMetaTags(context),
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  return { score, maxScore: 12, checks };
}

function checkLlmsTxt(context) {
  const content = getContent(context, "llms.txt", "/llms.txt");
  if (!content) {
    return fail(
      "llms.txt",
      4,
      "No llms.txt found. Create one describing what your site does for AI agents.",
    );
  }

  const tokens = estimateTokens(content);
  if (tokens > 5000) {
    return partial(
      "llms.txt",
      2,
      4,
      `llms.txt exists but is ${tokens} tokens (budget: <5000).`,
    );
  }

  const hasUsefulContent =
    content.length > 100 && !content.toLowerCase().includes("lorem");
  if (!hasUsefulContent) {
    return partial(
      "llms.txt",
      1,
      4,
      "llms.txt exists but has minimal/placeholder content.",
    );
  }

  const frontLoaded = checkFrontLoading(content);
  return frontLoaded
    ? pass("llms.txt", 4)
    : partial(
        "llms.txt",
        3,
        4,
        "llms.txt exists but doesn't front-load what/why/how in first 500 tokens.",
      );
}

function checkRobotsTxt(context) {
  const content = getContent(context, "robots.txt", "/robots.txt");
  if (!content) {
    return fail(
      "robots.txt AI crawlers",
      3,
      "No robots.txt found. Add one with explicit AI crawler rules.",
    );
  }

  const allowed = AI_CRAWLERS.filter(
    (bot) => content.includes(bot) && hasAllow(content, bot),
  );
  const blocked = AI_CRAWLERS.filter(
    (bot) => content.includes(bot) && hasDisallow(content, bot),
  );

  if (allowed.length >= 5) {
    return pass("robots.txt AI crawlers", 3);
  }
  if (blocked.length > 3) {
    return fail(
      "robots.txt AI crawlers",
      3,
      `Blocks ${blocked.length} AI crawlers. Consider allowing for discoverability.`,
    );
  }
  if (allowed.length > 0) {
    return partial(
      "robots.txt AI crawlers",
      1,
      3,
      `Only ${allowed.length}/9 AI crawlers explicitly allowed.`,
    );
  }
  return partial(
    "robots.txt AI crawlers",
    1,
    3,
    "robots.txt exists but doesn't mention AI crawlers. Add explicit Allow rules.",
  );
}

function checkSitemap(context) {
  const content = getContent(context, "sitemap.xml", "/sitemap.xml");
  if (!content) {
    return fail("sitemap.xml", 2, "No sitemap.xml found.");
  }
  const hasUrls = content.includes("<url>") || content.includes("<loc>");
  return hasUrls
    ? pass("sitemap.xml", 2)
    : partial(
        "sitemap.xml",
        1,
        2,
        "sitemap.xml exists but has no URL entries.",
      );
}

function checkAiMetaTags(context) {
  const html = context.html || "";
  if (!html) {
    return fail(
      "AI-friendly meta tags",
      3,
      "No HTML available to check meta tags.",
    );
  }

  let points = 0;
  if (html.includes("og:title") || html.includes("og:description")) points += 1;
  if (
    html.includes('meta name="description"') ||
    html.includes("meta name='description'")
  )
    points += 1;
  if (html.includes("application/ld+json")) points += 1;

  if (points === 3) return pass("AI-friendly meta tags", 3);
  if (points > 0)
    return partial(
      "AI-friendly meta tags",
      points,
      3,
      "Some meta tags present but incomplete (need og:, description, JSON-LD).",
    );
  return fail(
    "AI-friendly meta tags",
    3,
    "No AI-friendly meta tags (og:, description, JSON-LD) found.",
  );
}

const PAGE_KEY_MAP = {
  "llms.txt": "llmsTxt",
  "robots.txt": "robotsTxt",
  "sitemap.xml": "sitemap",
  "agents.json": "agentJson",
  "openapi.json": "openapi",
  "openapi.yaml": "openapi",
};

function getContent(context, filename) {
  if (context.mode === "url") {
    const key = PAGE_KEY_MAP[filename];
    const page = key ? context.pages[key] : null;
    return page && page.status === 200 ? page.text : null;
  }
  const match = context.files.find(
    (f) =>
      f === filename ||
      f.endsWith(`/${filename}`) ||
      f === `public/${filename}`,
  );
  return match ? context.fileContents[match] : null;
}

function toCamelCase(filename) {
  const name = filename.replace(/\.[^.]+$/, "");
  return name.replace(/[-_.](.)/g, (_, c) => c.toUpperCase());
}

function hasAllow(robotsTxt, bot) {
  const section = extractBotSection(robotsTxt, bot);
  return (
    section &&
    /Allow:\s*\//.test(section) &&
    !/Disallow:\s*\/\s*$/m.test(section)
  );
}

function hasDisallow(robotsTxt, bot) {
  const section = extractBotSection(robotsTxt, bot);
  return section && /Disallow:\s*\/\s*$/m.test(section);
}

function extractBotSection(robotsTxt, bot) {
  const regex = new RegExp(
    `User-agent:\\s*${bot}[\\s\\S]*?(?=User-agent:|$)`,
    "i",
  );
  const match = robotsTxt.match(regex);
  return match ? match[0] : null;
}

function checkFrontLoading(text) {
  const first500Tokens = text.slice(0, 2000);
  const hasWhat = /what|does|is/i.test(first500Tokens);
  const hasHow = /how|get started|install|use/i.test(first500Tokens);
  return hasWhat && hasHow;
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
