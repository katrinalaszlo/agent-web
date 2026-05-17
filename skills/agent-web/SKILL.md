---
name: agent-web
description: "Audit and fix agent-readiness for any website. Scores three layers, generates missing files by site type."
when_to_use: "make site agent-ready, llms.txt, agents.json, agent discovery, structured data for AI, robot.txt AI crawlers, agent experience audit"
disable-model-invocation: true
user-invocable: true
allowed-tools: WebFetch Read(*) Write(*) Bash(find *) Bash(grep *) Bash(ls *) Bash(cat *)
argument-hint: "[url-or-nothing]"
---

# agent-web — Make Your Site Agent-Ready

You audit websites for agent-readiness and generate the missing files.

## Philosophy

Three layers define agent-readiness:
1. **Discoverable** — Agents can find you (llms.txt, robots.txt, sitemap)
2. **Parseable** — Agents can understand you without scraping HTML (structured data, JSON endpoints, manifests)
3. **Actionable** — Agents can DO something with you (contact, API spec, pricing they can compare, booking links)

Most sites score 0/10. You fix that.

## Detect Mode

If `$ARGUMENTS` contains a URL (starts with http:// or https://):
→ **URL mode**: Fetch the live site, audit what's publicly visible, then check the local repo for gaps between source and live.

If `$ARGUMENTS` is empty or not a URL:
→ **Repo mode**: Audit the current working directory. Ask site type if unclear.

## Step 1: Determine Site Type

Infer from signals, then confirm with the user:
- Has pricing page + signup/login → SaaS product
- Single person, portfolio content, "about me" → Personal/portfolio
- Has /docs, /api, SDK references, developer-focused → API/developer tool
- Blog posts, articles, publication cadence → Content/blog

Four types:

- **SaaS product** — Has pricing, signup, dashboard. Needs machine-readable pricing, OpenAPI, capability manifest.
- **Personal/portfolio** — Person or small team. Needs expertise manifest, contact structured data, project listings.
- **API/developer tool** — Developer audience. Needs OpenAPI spec, integration docs as llms.txt, SDK manifest.
- **Content/blog** — Publishing-first. Needs topic map, article structured data, citation format.

## Step 2: Audit

### URL Mode
Fetch and check for:
- `GET /llms.txt` — exists? Quality?
- `GET /robots.txt` — allows AI crawlers?
- `GET /.well-known/agent.json` — agent manifest?
- `GET /sitemap.xml` — present?
- Check HTML `<head>` for JSON-LD structured data
- Check for `openapi.json` or `/api/docs`
- Check `<meta>` tags (og:, description)

### Repo Mode
Check local files:
- `llms.txt` or `llms-full.txt`
- `robots.txt`
- `agents.json` or `.well-known/agent.json`
- `sitemap.xml`
- Any `*.json` with schema.org or OpenAPI structure
- HTML files for JSON-LD in `<head>`
- `openapi.json` or `openapi.yaml`

## Step 3: Score

Rate each layer 0-10. Be harsh. Most sites are 1-3.

```
## Agent-Readiness Audit: [site]
Type: [inferred type]
Overall: X/10

### Discoverable (X/3)
- [ ] llms.txt — [MISSING / PRESENT / WEAK: reason]
- [ ] robots.txt AI crawlers — [MISSING / BLOCKS AI / ALLOWS]  
- [ ] sitemap.xml — [MISSING / PRESENT]

### Parseable (X/4)
- [ ] Structured data (JSON-LD) — [MISSING / PRESENT / WEAK: reason]
- [ ] Agent manifest (agents.json) — [MISSING / PRESENT]
- [ ] OpenAPI spec — [MISSING / PRESENT / N/A]
- [ ] Content negotiation (markdown) — [MISSING / PRESENT / N/A]

### Actionable (X/3)
- [ ] Machine-readable contact/booking — [MISSING / PRESENT]
- [ ] Programmatic pricing — [MISSING / PRESENT / N/A]
- [ ] API endpoint / action available — [MISSING / PRESENT / N/A]
```

## Step 4: Advise

For each gap, explain:
- **What's missing** — one line
- **Why it matters** — what agents can't do without it
- **What good looks like** — reference a real company doing it well

See [best-practices.md](best-practices.md) for the full opinionated framework per site type.

## Step 5: Generate

In repo mode, generate missing files directly. In URL mode, output the files as copyable blocks.

Before writing any file that already exists, show the user what you'd change and confirm.

### Generation order (dependencies):
1. `robots.txt` (foundation — tells crawlers what's allowed)
2. `llms.txt` (discovery — what the site IS)
3. `llms-full.txt` (if API/dev tool type — full docs inlined for context loading)
4. `AGENTS.md` (if GitHub repo — project structure for coding agents)
5. `agents.json` or `.well-known/agent.json` (manifest — structured capabilities)
6. JSON-LD structured data (inline in HTML or separate)
7. `openapi.json` (if API/SaaS type)
8. `pricing.json` (if SaaS type)

## Step 6: Re-score

Show before/after:
```
Before: 2/10 | After: 8/10
Discoverable: 0→3 | Parseable: 1→3 | Actionable: 1→2
```

## Important Rules

- Be opinionated. Don't hedge. If something is bad, say it's bad.
- Don't generate boilerplate. Every file should have REAL content from the actual site.
- llms.txt should be useful, not a copy of the homepage. Think: what would an agent need to recommend this site?
- robots.txt should explicitly name AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, Claude-User, Claude-SearchBot, Google-Extended, PerplexityBot, Meta-ExternalAgent).
- For SaaS pricing: generate schema.org PriceSpecification with real plan data. If you can't find pricing, ask the user.
- Never generate placeholder content like "[YOUR COMPANY]" — either use real data or ask.
