# agent-web

Audit and fix your site's agent-readiness. Opinionated, by site type.

## Install

```bash
npx skills add katrinalaszlo/agent-web
```

## What it does

Scores your website on three layers of agent-readiness, then generates the missing files:

- **Discoverable** — Can agents find you? (llms.txt, robots.txt, sitemap)
- **Parseable** — Can agents understand you? (structured data, agents.json, OpenAPI)
- **Actionable** — Can agents DO something with you? (pricing data, contact, API access)

## Two modes

```bash
/agent-web https://example.com    # Audit a live URL
/agent-web                        # Audit + generate in current repo
```

URL mode fetches and scores. Repo mode scores AND writes the missing files.

## Four site types

The skill infers your site type and tailors recommendations:

| Type | Key outputs |
|------|-------------|
| SaaS product | llms.txt, agents.json, pricing.json, OpenAPI |
| Personal/portfolio | llms.txt, agents.json (expertise + projects), Person schema |
| API/developer tool | llms-full.txt, OpenAPI, AGENTS.md, MCP manifest |
| Content/blog | llms.txt (topic map), Article schema, RSS |

## How it differs from isitagentready.com

Cloudflare's scanner tells you what's missing. This skill fixes it.

- They scan. We **generate**.
- They're generic. We're **opinionated by site type**.
- They're a website. We're **in your editor**, writing files into your repo.

## Scoring

```
Agent-Readiness: 3/10 → 8/10
Discoverable: 1→3 | Parseable: 1→4 | Actionable: 1→3
```

## What gets generated

Depending on gaps found:
- `robots.txt` with explicit AI crawler rules
- `llms.txt` written for agent consumption (not marketing copy)
- `llms-full.txt` (API/dev tools — full docs for context loading)
- `AGENTS.md` (GitHub repos — project structure for coding agents)
- `agents.json` with structured capabilities
- JSON-LD structured data per page type
- `openapi.json` (SaaS/API types)
- `pricing.json` (SaaS type)

## Author

Kat Laszlo — [@katlaszlo](https://x.com/Katlaszlo)
