export async function runCitationReadinessChecks(context) {
  const checks = [
    checkDirectAnswerFormat(context),
    checkQuestionHeadings(context),
    checkCitationStructure(context),
    checkDefinitiveStatements(context),
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  return { score, maxScore: 15, checks };
}

function checkDirectAnswerFormat(context) {
  const pages = getPageContents(context);
  if (pages.length === 0) {
    return fail("Direct answer formatting", 4, "No content pages to analyze.");
  }

  let directAnswerCount = 0;
  for (const page of pages.slice(0, 10)) {
    const paragraphs = extractParagraphs(page.content);
    const firstSubstantial = paragraphs.find((p) => p.length > 80);
    if (firstSubstantial) {
      const wordCount = firstSubstantial.split(/\s+/).length;
      if (wordCount >= 30 && wordCount <= 80) directAnswerCount++;
    }
  }

  const ratio = directAnswerCount / Math.min(pages.length, 10);
  if (ratio >= 0.6) return pass("Direct answer formatting", 4);
  if (ratio >= 0.3)
    return partial(
      "Direct answer formatting",
      2,
      4,
      `Only ${Math.round(ratio * 100)}% of pages lead with a 40-60 word summary. AI systems extract these as citations.`,
    );
  return partial(
    "Direct answer formatting",
    1,
    4,
    "Most pages don't lead with a concise summary (40-60 words). This is what AI systems cite.",
  );
}

function checkQuestionHeadings(context) {
  const content = getAllTextContent(context);
  if (!content) {
    return fail("Question-based headings", 4, "No content to analyze.");
  }

  const headings = extractHeadings(content);
  if (headings.length === 0) {
    return fail("Question-based headings", 4, "No headings found in content.");
  }

  const questionHeadings = headings.filter(
    (h) =>
      h.endsWith("?") ||
      /^(what|how|why|when|where|who|which|can|does|is|are|do)\b/i.test(h),
  );

  const ratio = questionHeadings.length / headings.length;
  if (ratio >= 0.3) return pass("Question-based headings", 4);
  if (ratio >= 0.1)
    return partial(
      "Question-based headings",
      2,
      4,
      `${questionHeadings.length}/${headings.length} headings are question-based. Aim for 30%+ — these match how users query AI.`,
    );
  if (questionHeadings.length > 0)
    return partial(
      "Question-based headings",
      1,
      4,
      "Very few question-based headings. Rephrase key H2/H3s as questions users would ask AI.",
    );
  return fail(
    "Question-based headings",
    4,
    'No question-based headings. AI systems match user queries to headings — use "What is X?" / "How to Y?" format.',
  );
}

function checkCitationStructure(context) {
  const pages = getPageContents(context);
  if (pages.length === 0) {
    return fail(
      "Citation-friendly structure",
      4,
      "No content pages to analyze.",
    );
  }

  let score = 0;
  let issues = [];

  const avgParaLength = getAverageParagraphLength(pages);
  if (avgParaLength <= 100) {
    score += 2;
  } else if (avgParaLength <= 150) {
    score += 1;
    issues.push("paragraphs slightly long for citation extraction");
  } else {
    issues.push("paragraphs too long — AI prefers short, citable blocks");
  }

  const hasLists = pages.some(
    (p) =>
      p.content.includes("- ") ||
      p.content.includes("* ") ||
      /<[ou]l/i.test(p.content),
  );
  if (hasLists) score += 1;
  else issues.push("no lists — AI extracts bulleted info easily");

  const hasTables = pages.some(
    (p) => p.content.includes("|") || /<table/i.test(p.content),
  );
  if (hasTables) score += 1;
  else issues.push("no tables — structured comparisons get cited");

  if (score === 4) return pass("Citation-friendly structure", 4);
  return partial(
    "Citation-friendly structure",
    score,
    4,
    issues.join("; ") + ".",
  );
}

function checkDefinitiveStatements(context) {
  const content = getAllTextContent(context);
  if (!content) {
    return fail("Definitive statements", 3, "No content to analyze.");
  }

  const sentences = content.split(/[.!]\s+/).filter((s) => s.length > 20);
  const definitive = sentences.filter(
    (s) =>
      /\b(is|are|was|means|defined as|refers to|consists of)\b/i.test(s) &&
      !/\b(might|maybe|perhaps|possibly|could be|generally)\b/i.test(s),
  );

  const ratio = sentences.length > 0 ? definitive.length / sentences.length : 0;
  if (ratio >= 0.2) return pass("Definitive statements", 3);
  if (ratio >= 0.1)
    return partial(
      "Definitive statements",
      2,
      3,
      "Some definitive statements but too much hedging. AI cites confident claims over uncertain ones.",
    );
  return partial(
    "Definitive statements",
    1,
    3,
    "Content uses weak/uncertain language. Make clear, definitive claims that AI can cite with confidence.",
  );
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

function getAllTextContent(context) {
  if (context.mode === "url") return context.html || "";
  return context.files
    .filter(
      (f) => f.endsWith(".md") || f.endsWith(".html") || f.endsWith(".txt"),
    )
    .map((f) => context.fileContents[f] || "")
    .join("\n");
}

function extractParagraphs(content) {
  if (content.includes("<p")) {
    return [...content.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) =>
      stripTags(m[1]).trim(),
    );
  }
  return content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("#"));
}

function extractHeadings(content) {
  const md = [...content.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1]);
  const html = [...content.matchAll(/<h[1-6][^>]*>([^<]+)/gi)].map((m) => m[1]);
  return md.length > html.length ? md : html;
}

function getAverageParagraphLength(pages) {
  let total = 0;
  let count = 0;
  for (const page of pages) {
    const paras = extractParagraphs(page.content).filter((p) => p.length > 20);
    for (const p of paras) {
      total += p.split(/\s+/).length;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "");
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
