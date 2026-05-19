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
| **Cloudflare** (isitagentready.com) | Discoverability, content accessibility, bot access, API/MCP/A2A discovery, commerce | 19 |
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
  aeo-ready — yoursite.com

  agentic-seo ·································· 91/100 A
    ✓ Discovery              25/25
    ◑ Content Structure      18/25
    ✓ Token Economics        25/25
    ✓ Capability Signaling   15/15
    ✓ UX Bridge               8/10
    vs Cloudflare 55 · Supabase 52 · Vercel 48 · Stripe 17

  Cloudflare ···································· 4/5 B
    10 passed  2 failed
    ✗ robotsTxtAiRules  No rules for AI bots found
    ✗ contentSignals    No content signals in robots.txt
    vs Cloudflare 5 · Vercel 4 · Supabase 3 · Stripe 2

  Fern ········································ 83/100 B
    9 passed  4 failed
    ✗ llms-txt-links-markdown  Links point to HTML, no markdown
    ✗ content-start-position   2 pages have content past 50%
    ✗ llms-txt-coverage        Covers 67% of sitemap
    ✗ markdown-content-parity  4 pages have content differences
    vs Stripe 85 · Supabase 78 · Anthropic 72 · Vercel 60

  ──────────────────────────────────────────────────
  Overall                                     85/100

  Next steps
    npx agentic-seo init                          scaffold llms.txt, AGENTS.md
    npx afdocs https://yoursite.com               4 Fern issues
    npx skills add katrinalaszlo/agent-serve      make your product agent-ready
```

## CI Mode

```yaml
- run: npx aeo-ready scan yoursite.com --dir ./public --threshold 50
```

## History

Scores persist in `.aeo-ready/history.json`. Re-scan to track improvement over time.

## Next step: make your product agent-ready

`aeo-ready` tells you how discoverable your site is to AI agents. To actually serve those agents — structured content, tool definitions, skill endpoints — use [agent-serve](https://github.com/katrinalaszlo/agent-serve):

```bash
npx skills add katrinalaszlo/agent-serve
```

## Author

Kat Laszlo — [@katlaszlo](https://x.com/Katlaszlo)
