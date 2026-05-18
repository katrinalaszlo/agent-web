export async function runActionableChecks(context) {
  const checks = [
    checkContact(context),
    checkPricing(context),
    checkApiEndpoint(context),
    checkSdkManifest(context),
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  return { score, maxScore: 10, checks };
}

function checkContact(context) {
  const html = context.html || "";
  const allContent = getAllContent(context);

  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(allContent);
  const hasCalLink = /cal\.com|calendly\.com|hubspot\.com\/meetings/.test(
    allContent,
  );
  const hasStructuredContact =
    allContent.includes("ContactPoint") || allContent.includes('"email"');

  let points = 0;
  if (hasEmail) points += 1;
  if (hasCalLink) points += 1;
  if (hasStructuredContact) points += 1;

  if (points === 3) return pass("Machine-readable contact", 3);
  if (points > 0) {
    const missing = [];
    if (!hasEmail) missing.push("email");
    if (!hasCalLink) missing.push("booking link");
    if (!hasStructuredContact) missing.push("structured ContactPoint");
    return partial(
      "Machine-readable contact",
      points,
      3,
      `Add: ${missing.join(", ")}.`,
    );
  }
  return fail(
    "Machine-readable contact",
    3,
    "No machine-readable contact info. Add email, cal.com link, or ContactPoint schema.",
  );
}

function checkPricing(context) {
  if (context.siteType === "personal" || context.siteType === "content") {
    return {
      name: "Programmatic pricing",
      passed: true,
      points: 3,
      maxPoints: 3,
      note: "N/A for site type",
    };
  }

  const allContent = getAllContent(context);
  const files = context.files || [];

  const hasPricingJson = files.some((f) => f.includes("pricing.json"));
  const hasPriceSchema =
    allContent.includes("PriceSpecification") || allContent.includes("offers");
  const hasPricingPage =
    allContent.includes("/pricing") || allContent.includes("pricing");

  if (hasPricingJson || hasPriceSchema) return pass("Programmatic pricing", 3);
  if (hasPricingPage)
    return partial(
      "Programmatic pricing",
      1,
      3,
      "Pricing page exists but not in structured format. Add schema.org PriceSpecification or pricing.json.",
    );
  return fail(
    "Programmatic pricing",
    3,
    "No programmatic pricing. Agents comparing you to competitors need structured plan data.",
  );
}

function checkApiEndpoint(context) {
  if (context.siteType === "personal") {
    return {
      name: "API endpoint",
      passed: true,
      points: 2,
      maxPoints: 2,
      note: "N/A for site type",
    };
  }

  const allContent = getAllContent(context);
  const hasApiRef = /\/api\/|\/v[12]\/|api-key|apikey/i.test(allContent);
  const hasOpenApi =
    context.files?.some((f) => f.includes("openapi")) ||
    context.pages?.openapi?.status === 200;

  if (hasApiRef && hasOpenApi) return pass("API endpoint", 2);
  if (hasApiRef)
    return partial(
      "API endpoint",
      1,
      2,
      "API references found but no formal spec. Add OpenAPI spec.",
    );
  return fail("API endpoint", 2, "No API endpoint detected.");
}

function checkSdkManifest(context) {
  if (context.siteType === "personal" || context.siteType === "content") {
    return {
      name: "SDK / integration manifest",
      passed: true,
      points: 2,
      maxPoints: 2,
      note: "N/A for site type",
    };
  }

  const allContent = getAllContent(context);
  const hasSdk = /npm install|pip install|go get|cargo add|maven|gradle/i.test(
    allContent,
  );
  const hasIntegrations = /integrat|connect|plugin|extension|mcp/i.test(
    allContent,
  );

  if (hasSdk) return pass("SDK / integration manifest", 2);
  if (hasIntegrations)
    return partial(
      "SDK / integration manifest",
      1,
      2,
      "Integration mentions found but no install commands or SDK manifest.",
    );
  return fail(
    "SDK / integration manifest",
    2,
    "No SDK or integration manifest detected.",
  );
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
