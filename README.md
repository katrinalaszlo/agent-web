# aeo-ready

AEO benchmark aggregator. One scan, every score.

```bash
npx aeo-ready scan yoursite.com
```

## What it does

Runs every major AEO (Agentic Engine Optimization) benchmark against your URL in one command. Shows per-check results, company comparisons, and tracks scores over time.

## Sources

| Benchmark | What it checks | Checks |
|-----------|---------------|--------|
| **agentic-seo** (Addy Osmani) | Discovery, content structure, token economics, capability signaling, UX bridge | 10 |
| **Cloudflare** (isitagentready.com) | Discoverability, content accessibility, bot access, API/auth/MCP/A2A discovery, commerce | 19 |
| **Fern** (afdocs) | llms.txt quality, markdown availability, page size, content structure, URL stability, auth | 23 |

## Output

```
  aeo-ready — AEO benchmark aggregator

  ─── Benchmarks ────────────────────────────────────

  ████░░░░░░░░░░░░ agentic-seo      23/100 (F)
    + llms.txt, - content structure, - token economics...
    compare: Cloudflare 55 · Supabase 52 · Vercel 48

  ████████████████ Cloudflare       5/5 (A)
    + robotsTxt, + sitemap, + linkHeaders, + agentSkills...
    compare: Cloudflare 5 · Vercel 4 · Supabase 3

  ████████████░░░░ Fern             72/100 (C)
    + llms-txt-exists, - content-negotiation, - llms-txt-coverage...
    compare: Stripe 85 · Supabase 78 · Anthropic 72

  Average across all sources: 45/100

  Fix it:
    npx agentic-seo init          scaffold llms.txt, AGENTS.md
    Fern: 10 issues — run npx afdocs https://yoursite.com
```

## Usage

```bash
npx aeo-ready scan yoursite.com           # scan a URL
npx aeo-ready scan yoursite.com --json    # JSON output for CI
npx aeo-ready scan yoursite.com --threshold 60  # exit 1 if below
```

## CI Mode

```yaml
- run: npx aeo-ready scan yoursite.com --threshold 50
```

## Dashboard

Each scan generates a self-contained HTML dashboard at `.aeo-ready/dashboard.html` with:
- Score cards for each benchmark
- Per-check detail (expandable)
- Company comparisons
- Score trends over time (inline SVG)
- Scan history with deltas

Auto-opens in browser after each scan.

## History

Scores persist in `.aeo-ready/history.json`. Re-scan to track improvement over time.

## Author

Kat Laszlo — [@katlaszlo](https://x.com/Katlaszlo)
