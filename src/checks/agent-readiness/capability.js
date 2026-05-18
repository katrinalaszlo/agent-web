export async function runCapabilityChecks(context) {
  const checks = [
    checkAgentInstructions(context),
    checkAgentManifest(context),
    checkOpenApiSpec(context),
    checkContentNegotiation(context),
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  return { score, maxScore: 13, checks };
}

function checkAgentInstructions(context) {
  const names = ["AGENTS.md", "CLAUDE.md", "agents.md", "claude.md"];
  const skillFiles = ["skill.md", "skills/"];

  if (context.mode === "url") {
    const html = context.html || "";
    const hasAgentFile = names.some((n) => html.includes(n));
    return hasAgentFile
      ? partial(
          "AGENTS.md / CLAUDE.md",
          2,
          4,
          "Referenced in HTML but not directly accessible at known path.",
        )
      : fail(
          "AGENTS.md / CLAUDE.md",
          4,
          "No agent instruction file (AGENTS.md, CLAUDE.md) detected.",
        );
  }

  const found = context.files.find((f) => {
    const base = f.split("/").pop();
    return names.includes(base) || skillFiles.some((s) => f.includes(s));
  });

  if (!found) {
    return fail(
      "AGENTS.md / CLAUDE.md",
      4,
      "No agent instruction file found. Add AGENTS.md or CLAUDE.md to repo root.",
    );
  }

  const content = context.fileContents[found] || "";
  const hasStructure = content.includes("#") && content.length > 200;
  const hasConstraints = /constraint|limit|rate|require/i.test(content);
  const hasCapabilities = /capabilit|can do|feature|endpoint/i.test(content);

  let points = 2;
  if (hasStructure && hasCapabilities) points = 3;
  if (hasStructure && hasCapabilities && hasConstraints) points = 4;

  if (points === 4) return pass("AGENTS.md / CLAUDE.md", 4);
  const missing = [];
  if (!hasCapabilities) missing.push("capabilities");
  if (!hasConstraints) missing.push("constraints/limits");
  return partial(
    "AGENTS.md / CLAUDE.md",
    points,
    4,
    `Agent file exists but missing: ${missing.join(", ")}.`,
  );
}

function checkAgentManifest(context) {
  const content = getContent(context, "agents.json", "/.well-known/agent.json");

  if (!content) {
    return fail(
      "agents.json manifest",
      3,
      "No agents.json or .well-known/agent.json found.",
    );
  }

  try {
    const manifest = JSON.parse(content);
    const hasName = !!manifest.name;
    const hasCapabilities =
      Array.isArray(manifest.capabilities) && manifest.capabilities.length > 0;
    const hasInterfaces = !!manifest.interfaces;

    if (hasName && hasCapabilities && hasInterfaces)
      return pass("agents.json manifest", 3);
    const missing = [];
    if (!hasName) missing.push("name");
    if (!hasCapabilities) missing.push("capabilities");
    if (!hasInterfaces) missing.push("interfaces");
    return partial(
      "agents.json manifest",
      1,
      3,
      `agents.json exists but missing: ${missing.join(", ")}.`,
    );
  } catch {
    return partial(
      "agents.json manifest",
      1,
      3,
      "agents.json exists but is not valid JSON.",
    );
  }
}

function checkOpenApiSpec(context) {
  const jsonContent = getContent(context, "openapi.json", "/openapi.json");
  const yamlContent = getContent(context, "openapi.yaml", "/openapi.yaml");
  const content = jsonContent || yamlContent;

  if (!content) {
    if (context.siteType === "content" || context.siteType === "personal") {
      return {
        name: "OpenAPI spec",
        passed: true,
        points: 3,
        maxPoints: 3,
        note: "N/A for site type",
      };
    }
    return fail(
      "OpenAPI spec",
      3,
      "No OpenAPI spec found. Add openapi.json or openapi.yaml.",
    );
  }

  const hasEndpoints = content.includes("paths") || content.includes("/api");
  const hasVersion = content.includes("openapi") || content.includes("swagger");

  if (hasEndpoints && hasVersion) return pass("OpenAPI spec", 3);
  return partial(
    "OpenAPI spec",
    2,
    3,
    "OpenAPI spec exists but may be incomplete.",
  );
}

function checkContentNegotiation(context) {
  if (context.mode === "url") {
    const headers = context.pages.home?.headers || {};
    const acceptsMarkdown =
      headers["content-type"]?.includes("markdown") ||
      headers["vary"]?.includes("Accept");
    return acceptsMarkdown
      ? pass("Content negotiation", 3)
      : fail(
          "Content negotiation",
          3,
          "No content negotiation detected. Serve markdown when Accept: text/markdown is requested.",
        );
  }

  const hasMiddleware = context.files.some(
    (f) => f.includes("middleware") || f.includes("negotiat"),
  );
  if (hasMiddleware)
    return partial(
      "Content negotiation",
      2,
      3,
      "Middleware detected — verify Accept: text/markdown is handled.",
    );
  return fail(
    "Content negotiation",
    3,
    "No content negotiation setup. Consider serving markdown for Accept: text/markdown requests.",
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
      f === `.well-known/${filename}` ||
      f === `public/.well-known/${filename}`,
  );
  return match ? context.fileContents[match] : null;
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
