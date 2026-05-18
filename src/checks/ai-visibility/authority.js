export async function runAuthorityChecks(context) {
  const checks = [
    checkEeat(context),
    checkEntityOptimization(context),
    checkExternalValidation(context),
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  return { score, maxScore: 13, checks };
}

function checkEeat(context) {
  const allContent = getAllContent(context);
  const html = context.html || "";

  let points = 0;
  const signals = [];

  const hasAuthorBio =
    /author|written by|by [A-Z]/i.test(allContent) &&
    (/bio|about the author|expertise|experience/i.test(allContent) ||
      allContent.includes("Person"));
  if (hasAuthorBio) {
    points += 1;
    signals.push("author bio");
  }

  const hasCredentials =
    /credential|certified|years of experience|expert|specialist|phd|mba/i.test(
      allContent,
    );
  if (hasCredentials) {
    points += 1;
    signals.push("credentials");
  }

  const hasExperience =
    /built|shipped|worked on|founded|created|contributed to/i.test(allContent);
  if (hasExperience) {
    points += 1;
    signals.push("experience signals");
  }

  const hasPersonSchema =
    allContent.includes('"Person"') || allContent.includes("'Person'");
  if (hasPersonSchema) {
    points += 1;
    signals.push("Person schema");
  }

  if (points === 4) return pass("E-E-A-T signals", 4);
  if (points > 0) {
    const missing = [];
    if (!hasAuthorBio) missing.push("author bios");
    if (!hasCredentials) missing.push("credentials");
    if (!hasExperience) missing.push("first-hand experience");
    if (!hasPersonSchema) missing.push("Person schema");
    return partial(
      "E-E-A-T signals",
      points,
      4,
      `Has: ${signals.join(", ")}. Missing: ${missing.join(", ")}.`,
    );
  }
  return fail(
    "E-E-A-T signals",
    4,
    "No E-E-A-T signals (author bios, credentials, experience markers, Person schema). AI prioritizes authoritative sources.",
  );
}

function checkEntityOptimization(context) {
  const allContent = getAllContent(context);

  let points = 0;
  const signals = [];

  const hasSameAs = allContent.includes("sameAs");
  if (hasSameAs) {
    points += 1;
    signals.push("sameAs links");
  }

  const hasConsistentNaming = checkNameConsistency(allContent, context);
  if (hasConsistentNaming) {
    points += 1;
    signals.push("consistent naming");
  }

  const hasIdentifiers = /github\.com|linkedin\.com|twitter\.com|x\.com/i.test(
    allContent,
  );
  if (hasIdentifiers) {
    points += 2;
    signals.push("cross-platform identifiers");
  }

  if (points >= 3) return pass("Entity optimization", 3);
  if (points > 0) {
    return partial(
      "Entity optimization",
      Math.min(points, 2),
      3,
      `Entity signals: ${signals.join(", ")}. Add sameAs links and consistent naming across platforms.`,
    );
  }
  return fail(
    "Entity optimization",
    3,
    "No entity optimization. Add sameAs links, consistent naming, and cross-platform profile links for AI entity resolution.",
  );
}

function checkExternalValidation(context) {
  const allContent = getAllContent(context);

  let points = 0;

  const hasExternalLinks =
    /https?:\/\/(?!.*(?:localhost|127\.0\.0|example\.com))/i.test(allContent);
  if (hasExternalLinks) points += 1;

  const hasCitations =
    /\[\d+\]|source:|reference:|according to|research shows/i.test(allContent);
  if (hasCitations) points += 1;

  const hasDataClaims =
    /\d+%|\d+x|\$[\d,]+|increased by|reduced by|improved/i.test(allContent);
  if (hasDataClaims) points += 1;

  if (points === 3) return pass("External validation & references", 3);
  if (points > 0) {
    const missing = [];
    if (!hasExternalLinks) missing.push("external source links");
    if (!hasCitations) missing.push("cited references");
    if (!hasDataClaims) missing.push("quantified claims");
    return partial(
      "External validation & references",
      points,
      3,
      `Add: ${missing.join(", ")}. AI trusts content that cites sources.`,
    );
  }
  return fail(
    "External validation & references",
    3,
    "No external validation — no cited sources, references, or quantified claims. AI weighs evidence-backed content higher.",
  );
}

function checkNameConsistency(content, context) {
  if (context.mode === "url" && context.url) {
    try {
      const hostname = new URL(context.url).hostname
        .replace("www.", "")
        .split(".")[0];
      const mentions =
        content.toLowerCase().split(hostname.toLowerCase()).length - 1;
      return mentions >= 3;
    } catch {
      return false;
    }
  }
  const pkg = context.fileContents?.["package.json"];
  if (pkg) {
    try {
      const name = JSON.parse(pkg).name;
      return name && content.split(name).length > 3;
    } catch {
      return false;
    }
  }
  return false;
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
