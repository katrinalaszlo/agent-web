# aeo-ready

AEO benchmark aggregator. One scan, every score.

```bash
npx aeo-ready scan yoursite.com
```

## What it does

Runs every major AEO (Agentic Engine Optimization) benchmark against your site in one command. Shows per-check pass/fail, company comparisons, and tracks scores over time.

## Sources

| Benchmark | What it checks | Checks |
|-----------|---------------|--------|
| **agentic-seo** (Addy Osmani) | Discovery, content structure, token economics, capability signaling, UX bridge | 10 |
| **Cloudflare** (isitagentready.com) | Discoverability, content accessibility, bot access, API/auth/MCP/A2A discovery, commerce | 19 |
| **Fern** (afdocs) | llms.txt quality, markdown availability, page size, content structure, URL stability, auth | 23 |

## Usage

```bash
npx aeo-ready scan yoursite.com                   # scan a URL (remote checks)
npx aeo-ready scan yoursite.com --dir ./public    # full scan (local + remote)
npx aeo-ready scan yoursite.com --json            # JSON output for CI
npx aeo-ready scan yoursite.com --threshold 60    # exit 1 if below
```

### Why `--dir`?

agentic-seo scores ~23/100 in URL-only mode because most checks (content structure, token economics, capability signaling, UX bridge) need filesystem access. Pass `--dir` to your build output or public directory to get the real score.

```
URL-only:  agentic-seo 23/100 (F)
With --dir: agentic-seo 92/100 (A)
```

## Output

```
  aeo-ready — AEO benchmark aggregator

  ─── Benchmarks ────────────────────────────────────

  ███████████████░ agentic-seo      92/100 (A)
    ✓ Discovery              25/25
    ◑ Content Structure      19/25
    ✓ Token Economics        25/25
    ✓ Capability Signaling   15/15
    ✓ UX Bridge              8/10
    compare: Cloudflare 55 · Supabase 52 · Vercel 48

  █████████████░░░ Cloudflare       4/5 (B)
    + robotsTxt, + sitemap, + linkHeaders, + agentSkills...
    compare: Cloudflare 5 · Vercel 4 · Supabase 3

  █████████████░░░ Fern             83/100 (B)
    + llms-txt-exists, + rendering-strategy, - content-negotiation...
    compare: Stripe 85 · Supabase 78 · Anthropic 72

  Average across all sources: 85/100

  Fix it:
    npx agentic-seo init          scaffold llms.txt, AGENTS.md
    Fern: 6 issues — run npx afdocs https://yoursite.com
```

## CI Mode

```yaml
- run: npx aeo-ready scan yoursite.com --dir ./public --threshold 50
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
