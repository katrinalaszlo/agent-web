# agent-web

Is your site AI-ready? One scan, two scorecards, one score.

```bash
npx agent-web scan --url https://your-site.com
```

## What it measures

**Agent Readiness** (0-50) — Can AI agents discover, parse, and act on your site?
- Discovery: llms.txt, robots.txt AI crawlers, sitemap, meta tags
- Content Structure: markdown availability, heading hierarchy, token budgets, front-loading
- Capability Signaling: AGENTS.md, agents.json, OpenAPI, content negotiation
- Actionable: machine-readable contact, pricing, API endpoints, SDK manifest

**AI Visibility** (0-50) — Does your content get cited in AI-generated responses?
- Structured Data: schema.org, FAQ markup, rich schemas, Open Graph
- Citation Readiness: direct answer formatting, question headings, citable structure
- Authority: E-E-A-T signals, entity optimization, external validation
- Freshness: modification dates, publication cadence, content recency

**Overall: X/100** with letter grade (A-F).

## Usage

```bash
# Audit a live URL
npx agent-web scan --url https://example.com

# Audit current directory (repo mode)
npx agent-web scan

# JSON output for CI pipelines
npx agent-web scan --json --threshold 60

# Skip benchmark comparison
npx agent-web scan --no-benchmark
```

## Output

```
  agent-web — AI readiness audit

  Mode: url | Type: saas

  Overall: C 50/100

  Agent Readiness: 22/50
    discovery: 3/12
      + AI-friendly meta tags [3]
      - llms.txt [0/4]
        fix: No llms.txt found.
      - robots.txt AI crawlers [0/3]
        fix: robots.txt exists but doesn't mention AI crawlers.

  AI Visibility: 28/50
    structured Data: 6/12
      + FAQ markup [3]
      + Rich schemas [3]
      - Schema.org markup [0/4]
        fix: type doesn't match site category.

  Second opinion: agentic-seo scored you 45/100
```

## CI Mode

Exit with code 1 if below threshold:

```bash
npx agent-web scan --json --threshold 60
```

Add to GitHub Actions:

```yaml
- run: npx agent-web scan --threshold 50
```

## Benchmark

Runs `npx agentic-seo --json` as an independent second opinion. Shows their score alongside yours. If agentic-seo isn't installed, the benchmark line is skipped gracefully.

## History

Each scan saves to `.agent-web/history.json`. Gitignored by default.

## Site Type Detection

Automatically infers site type from signals:
- **SaaS** — pricing + auth pages detected
- **API/Developer Tool** — /docs, /api, SDK references
- **Content/Blog** — articles, blog posts, publication cadence
- **Personal/Portfolio** — portfolio, about me, single person

Scoring adjusts by type (e.g., OpenAPI is required for SaaS, N/A for personal sites).

## Coming Soon

- `--fix` mode: generate missing files (robots.txt, meta tags, structured data)
- HTML dashboard with score trends over time
- Citation correlation: query AI models and track whether fixes improve citations

## Also available as a Claude Code skill

```bash
npx skills add katrinalaszlo/agent-web
```

Then use `/agent-web` or `/agent-web https://example.com` inside Claude Code for an interactive audit that also generates missing files.

## Author

Kat Laszlo — [@katlaszlo](https://x.com/Katlaszlo)
