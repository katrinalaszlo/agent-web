import { existsSync, readFileSync } from "fs";
import { join } from "path";

export function generateLlmsTxt(check, scanResult, dir) {
  const { siteType, target } = scanResult;
  const hostname = extractHostname(target);
  const name = inferName(dir, hostname);

  const content = generateByType(siteType, name, target);

  return {
    file: "llms.txt",
    description: `Draft llms.txt for ${siteType} site — REVIEW AND EDIT before publishing`,
    draft: true,
    content,
  };
}

function generateByType(siteType, name, target) {
  const base = target || "https://example.com";

  switch (siteType) {
    case "saas":
      return `# ${name || "[Company Name]"}

> [One sentence: what problem you solve and for whom]

## What it does
- [Core capability 1]
- [Core capability 2]
- [Core capability 3]

## Pricing
- [Plan 1]: $X/mo — [what's included]
- [Plan 2]: $X/mo — [what's included]
- Details: ${base}/pricing

## Integration
- API docs: ${base}/docs
- OpenAPI spec: ${base}/openapi.json
- Auth: [API key / OAuth / etc]

## Get started
1. [Signup step]
2. [First API call or setup]
3. [See results]

## Links
- Documentation: ${base}/docs
- Changelog: ${base}/changelog
- Status: ${base}/status
`;

    case "api":
      return `# ${name || "[Tool Name]"}

> [One sentence: what this tool does]

## Quick start
\`\`\`bash
[install command]
\`\`\`

## Key concepts
- [Concept 1]: [one-line explanation]
- [Concept 2]: [one-line explanation]

## API reference
- Base URL: ${base}/api/v1
- Auth: [method]
- OpenAPI: ${base}/openapi.json

## SDKs
- Node.js: \`npm install [package]\`
- Python: \`pip install [package]\`

## Links
- Full docs: ${base}/docs
- Examples: ${base}/examples
- Changelog: ${base}/changelog
`;

    case "personal":
      return `# ${name || "[Your Name]"}

> [Role/title] — [what you're known for]

## Expertise
- [Area 1]
- [Area 2]
- [Area 3]

## Notable work
- [Project 1]: [one-line description] — [url]
- [Project 2]: [one-line description] — [url]

## Writing & speaking
- [Topic you cover]
- [Where to find your content]

## Contact
- Email: [email]
- LinkedIn: [url]
- Available for: [consulting / speaking / hiring / etc]
`;

    case "content":
      return `# ${name || "[Publication Name]"}

> [What topics you cover and your angle/expertise]

## Topics
- [Topic 1]: [what you cover, how many pieces]
- [Topic 2]: [what you cover, how many pieces]

## Best starting points
- [Most important article]: ${base}/[path]
- [Second article]: ${base}/[path]
- [Third article]: ${base}/[path]

## About
- Author(s): [who writes]
- Cadence: [how often you publish]
- Angle: [what makes your coverage unique]

## Links
- All articles: ${base}/blog
- RSS: ${base}/feed.xml
- Newsletter: ${base}/subscribe
`;

    default:
      return `# ${name || "[Site Name]"}

> [One sentence: what this site is and who it's for]

## What you'll find here
- [Section 1]: [description]
- [Section 2]: [description]

## Links
- Homepage: ${base}
`;
  }
}

function extractHostname(target) {
  if (!target) return null;
  try {
    return new URL(target).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

function inferName(dir, hostname) {
  const pkgPath = join(dir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      if (pkg.name) return pkg.name;
    } catch {}
  }
  if (hostname) return hostname.split(".")[0];
  return "";
}
