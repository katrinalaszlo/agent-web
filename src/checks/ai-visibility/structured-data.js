export async function runStructuredDataChecks(context) {
  const checks = [
    checkSchemaOrg(context),
    checkFaqMarkup(context),
    checkRichSchemas(context),
    checkOpenGraph(context),
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  return { score, maxScore: 12, checks };
}

function checkSchemaOrg(context) {
  const allContent = getAllContent(context);
  const html = context.html || "";

  const jsonLdBlocks = extractJsonLd(html);
  if (jsonLdBlocks.length === 0 && !allContent.includes("schema.org")) {
    return fail(
      "Schema.org markup",
      4,
      "No schema.org structured data found. Add JSON-LD with appropriate type (SoftwareApplication, Person, Article, Organization).",
    );
  }

  let points = 2;
  const types = jsonLdBlocks.map((b) => b["@type"]).filter(Boolean);
  const hasCorrectType = hasAppropriateType(types, context.siteType);
  if (hasCorrectType) points += 1;
  const hasRequiredFields = jsonLdBlocks.some((b) => hasMinimumFields(b));
  if (hasRequiredFields) points += 1;

  if (points === 4) return pass("Schema.org markup", 4);
  const issues = [];
  if (!hasCorrectType) issues.push("type doesn't match site category");
  if (!hasRequiredFields) issues.push("missing required fields");
  return partial(
    "Schema.org markup",
    points,
    4,
    `Schema.org present but: ${issues.join(", ")}.`,
  );
}

function checkFaqMarkup(context) {
  const html = context.html || "";
  const allContent = getAllContent(context);

  const hasFaqSchema =
    allContent.includes("FAQPage") || allContent.includes("Question");
  const hasFaqContent = /faq|frequently asked|common questions/i.test(
    allContent,
  );

  if (hasFaqSchema) return pass("FAQ markup", 3);
  if (hasFaqContent) {
    return partial(
      "FAQ markup",
      1,
      3,
      "FAQ content exists but not marked up with FAQPage schema. Add JSON-LD FAQPage.",
    );
  }
  return fail(
    "FAQ markup",
    3,
    "No FAQ markup. Add FAQPage schema for common questions — these surface directly in AI answers.",
  );
}

function checkRichSchemas(context) {
  const allContent = getAllContent(context);

  const schemas = [];
  if (allContent.includes("BreadcrumbList")) schemas.push("Breadcrumb");
  if (allContent.includes("HowTo")) schemas.push("HowTo");
  if (
    allContent.includes("Product") ||
    allContent.includes("SoftwareApplication")
  )
    schemas.push("Product");
  if (allContent.includes("VideoObject")) schemas.push("Video");
  if (allContent.includes("Review") || allContent.includes("AggregateRating"))
    schemas.push("Review");

  if (schemas.length >= 2)
    return pass("Rich schemas (Breadcrumb/HowTo/Product)", 3);
  if (schemas.length === 1)
    return partial(
      "Rich schemas (Breadcrumb/HowTo/Product)",
      2,
      3,
      `Only ${schemas[0]} schema found. Add more rich schemas for better AI comprehension.`,
    );
  return fail(
    "Rich schemas (Breadcrumb/HowTo/Product)",
    3,
    "No rich schemas (BreadcrumbList, HowTo, Product). These help AI understand page context and relationships.",
  );
}

function checkOpenGraph(context) {
  const html = context.html || "";

  const hasOgTitle = /og:title/i.test(html);
  const hasOgDesc = /og:description/i.test(html);
  const hasMetaDesc = /name=["']description["']/i.test(html);

  let points = 0;
  if (hasOgTitle) points += 1;
  if (hasOgDesc || hasMetaDesc) points += 1;

  if (points === 2) return pass("Open Graph + meta description", 2);
  if (points === 1)
    return partial(
      "Open Graph + meta description",
      1,
      2,
      "Partial OG/meta tags. Need both og:title and description.",
    );
  return fail(
    "Open Graph + meta description",
    2,
    "No Open Graph or meta description tags. AI systems use these for page summaries.",
  );
}

function extractJsonLd(html) {
  const blocks = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      /* skip invalid */
    }
  }
  return blocks;
}

function hasAppropriateType(types, siteType) {
  const typeMap = {
    saas: ["SoftwareApplication", "WebApplication", "Product", "Organization"],
    api: ["SoftwareApplication", "WebAPI", "TechArticle"],
    content: ["Article", "BlogPosting", "WebSite", "Organization"],
    personal: ["Person", "ProfilePage", "WebSite"],
  };
  const expected = typeMap[siteType] || [];
  return types.some((t) => expected.includes(t));
}

function hasMinimumFields(block) {
  const required = ["name", "@type"];
  return required.every((f) => block[f]);
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
