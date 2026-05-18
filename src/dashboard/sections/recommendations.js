const HOW_TO_FIX = {
  "llms.txt": {
    time: "1 hour",
    steps: [
      "Create a file called <code>llms.txt</code> in your site root",
      "First line: <code># Your Company Name</code>",
      "Second line: one sentence describing what you do and for whom",
      "List 3-5 key features, pricing model, and how to get started",
      "Keep it under 5,000 tokens — this is NOT your homepage copy",
      "Deploy it so it's accessible at <code>yoursite.com/llms.txt</code>",
    ],
    example: `# Acme Corp\n> API-first billing platform for SaaS companies.\n\n## What it does\n- Usage-based billing with real-time metering\n- Self-serve pricing pages\n- Revenue recognition automation\n\n## Pricing\n- Starter: $0/mo (up to $10K MRR)\n- Growth: $499/mo\n- Enterprise: custom\n\n## Get started\n1. Sign up at acme.com/signup\n2. Install SDK: npm install @acme/billing\n3. Add 3 lines of code to start metering`,
  },
  "robots.txt AI crawlers": {
    time: "5 minutes",
    steps: [
      "Open your <code>robots.txt</code> file (or create one in your site root)",
      "Add explicit Allow rules for each AI crawler",
      "Deploy — most hosting platforms serve this automatically from root",
    ],
    example: `User-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /`,
    auto: "Run <code>npx aeo-ready scan --fix</code> to generate this automatically.",
  },
  "AGENTS.md / CLAUDE.md": {
    time: "30 minutes",
    steps: [
      "Create <code>AGENTS.md</code> in your repo root",
      "Describe your project structure — key directories and what's in them",
      "List development commands (install, run, test)",
      "Note constraints: rate limits, auth requirements, external dependencies",
      "Keep it factual and precise — LLM-generated AGENTS.md files hurt agent success rates",
    ],
    auto: "Run <code>npx aeo-ready scan --fix</code> to get a scaffold, then edit it.",
  },
  "agents.json manifest": {
    time: "20 minutes",
    steps: [
      "Create <code>.well-known/agent.json</code> in your site root",
      "Add name, description, and capabilities array",
      "Link to your llms.txt and OpenAPI spec",
      "Include contact info and auth method",
    ],
    example: `{\n  "schema_version": "1.0",\n  "name": "Your Product",\n  "description": "What it does in one sentence",\n  "capabilities": ["api-integration", "pricing-lookup"],\n  "interfaces": {\n    "human": "/",\n    "llm": "/llms.txt",\n    "api": "/openapi.json"\n  }\n}`,
    auto: "Run <code>npx aeo-ready scan --fix</code> to generate a draft.",
  },
  "Question-based headings": {
    time: "1-2 hours",
    steps: [
      "Find your top 10 pages by traffic or importance",
      "Rewrite H2/H3 headings as questions users would ask AI",
      'Example: change "Pricing" → "How much does [Product] cost?"',
      'Example: change "Features" → "What can [Product] do?"',
      "Aim for 30%+ of headings to be question-based",
    ],
  },
  "Direct answer formatting": {
    time: "1-2 hours",
    steps: [
      "On each key page, add a 40-60 word summary as the first paragraph",
      "This paragraph should directly answer the question the page addresses",
      "Don't start with background or context — lead with the answer",
      "AI systems extract this as the citation snippet",
    ],
    example: `<!-- Before -->\n<h1>Our Billing Platform</h1>\n<p>Founded in 2020, we set out to solve...</p>\n\n<!-- After -->\n<h1>Our Billing Platform</h1>\n<p>Acme is a usage-based billing platform that helps SaaS companies meter API calls, automate invoicing, and recognize revenue. Plans start at $0/mo for up to $10K MRR.</p>`,
  },
  "FAQ markup": {
    time: "30 minutes",
    steps: [
      "Identify 5-10 common questions about your product",
      "Add them to your page as a FAQ section",
      "Wrap them in FAQPage JSON-LD schema",
      "Add the script tag to your page's <code>&lt;head&gt;</code>",
    ],
    example: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [{\n    "@type": "Question",\n    "name": "What does Acme cost?",\n    "acceptedAnswer": {\n      "@type": "Answer",\n      "text": "Acme starts free for up to $10K MRR. Growth is $499/mo."\n    }\n  }]\n}\n</script>`,
  },
  "Schema.org markup": {
    time: "30 minutes",
    steps: [
      "Determine your schema type: SoftwareApplication (SaaS), Person (portfolio), Article (blog)",
      "Create a JSON-LD block with required fields (name, description, url)",
      "Add it to your homepage <code>&lt;head&gt;</code> in a script tag",
      "For SaaS: include <code>offers</code> with pricing per plan",
    ],
    example: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "SoftwareApplication",\n  "name": "Your Product",\n  "description": "One sentence",\n  "url": "https://yoursite.com",\n  "offers": [{\n    "@type": "Offer",\n    "name": "Starter",\n    "price": "0",\n    "priceCurrency": "USD"\n  }]\n}\n</script>`,
  },
  "E-E-A-T signals": {
    time: "1 hour",
    steps: [
      "Add author bios with name, role, and credentials to content pages",
      "Add a Person JSON-LD schema for each author",
      "Include first-hand experience markers: 'We built...', 'In our experience...'",
      "Link to author profiles on LinkedIn, GitHub, Twitter",
    ],
  },
  "Content negotiation": {
    time: "2-4 hours (requires code)",
    steps: [
      "Add middleware that checks the <code>Accept</code> header on requests",
      "When <code>Accept: text/markdown</code> is present, return markdown instead of HTML",
      "Strip navigation, footers, and chrome — return just the content",
      "This saves agents thousands of tokens vs parsing your HTML",
    ],
  },
  "Definitive statements": {
    time: "1-2 hours",
    steps: [
      "Search your content for hedging words: 'might', 'perhaps', 'possibly', 'could be'",
      "Replace with direct claims: 'is', 'does', 'provides', 'enables'",
      "AI cites confident statements over uncertain ones",
      "Back claims with data: '50% faster' is better than 'significantly faster'",
    ],
  },
};

export function renderRecommendations(result) {
  const failed = [];

  for (const scorecard of [result.agentReadiness, result.aiVisibility]) {
    for (const [catName, cat] of Object.entries(scorecard.categories)) {
      for (const check of cat.checks) {
        if (!check.passed && check.fix) {
          const impact = check.maxPoints - (check.points || 0);
          failed.push({ ...check, category: catName, impact });
        }
      }
    }
  }

  failed.sort((a, b) => b.impact - a.impact);
  const top = failed.slice(0, 8);

  if (top.length === 0) {
    return `<h2 id="recommendations">Recommendations</h2>\n<p style="color:#3fb950;font-size:13px;">All checks passing. Nice.</p>`;
  }

  let html = `<h2 id="recommendations">How To Fix It</h2>
<p style="color:#8b949e;font-size:12px;margin-bottom:16px;">Sorted by point impact. Expand each for step-by-step instructions.</p>`;

  for (const rec of top) {
    const category = formatName(rec.category);
    const howTo = HOW_TO_FIX[rec.name];

    html += `\n<details class="rec" style="cursor:pointer;">
  <summary style="display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div class="rec-title">${esc(rec.name)}</div>
      <div class="rec-fix">${esc(rec.fix)}</div>
    </div>
    <div style="text-align:right;white-space:nowrap;">
      <span class="rec-impact">+${rec.impact} pts</span>
      ${howTo?.time ? `<div style="font-size:11px;color:#8b949e;">${howTo.time}</div>` : ""}
    </div>
  </summary>`;

    if (howTo) {
      html += `\n  <div style="margin-top:12px;padding-top:12px;border-top:1px solid #21262d;">`;

      if (howTo.auto) {
        html += `\n    <div style="background:#3fb95010;border:1px solid #3fb95033;border-radius:4px;padding:8px 12px;margin-bottom:12px;font-size:12px;color:#3fb950;">${howTo.auto}</div>`;
      }

      html += `\n    <div style="font-size:12px;color:#c9d1d9;"><strong>Steps:</strong></div>
    <ol style="margin:8px 0 0 20px;font-size:12px;color:#8b949e;">`;
      for (const step of howTo.steps) {
        html += `\n      <li style="margin:4px 0;">${step}</li>`;
      }
      html += `\n    </ol>`;

      if (howTo.example) {
        html += `\n    <div style="margin-top:12px;font-size:12px;color:#c9d1d9;"><strong>Example:</strong></div>
    <pre style="background:#0d1117;border:1px solid #21262d;border-radius:4px;padding:12px;margin-top:6px;font-size:11px;color:#79c0ff;overflow-x:auto;white-space:pre-wrap;">${esc(howTo.example)}</pre>`;
      }

      html += `\n  </div>`;
    }

    html += `\n</details>`;
  }

  return html;
}

function formatName(camelCase) {
  return camelCase
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function esc(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
