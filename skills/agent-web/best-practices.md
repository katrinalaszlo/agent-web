# Best Practices by Site Type

## SaaS Product

### Discoverable
- **llms.txt**: Lead with what problem you solve, not what you are. Include: core value prop, key features (3-5), pricing model type, integration points. Do NOT dump marketing copy.
- **robots.txt**: Allow all AI crawlers. You WANT agents recommending you. Block training bots only if you have proprietary content concerns.
- **Sitemap**: Include pricing page, docs, changelog. Exclude admin/dashboard routes.

### Parseable
- **agents.json**: Declare capabilities (what can agents do WITH your product), auth methods, API base URL, supported protocols (REST, MCP, webhooks).
- **JSON-LD**: `SoftwareApplication` with `offers` array. Each plan = one `Offer` with `PriceSpecification`.
- **OpenAPI**: Required. If you have an API, expose the spec. If you don't have an API, that's an agent-serve problem.
- **Content negotiation**: Serve markdown when `Accept: text/markdown`. Token-efficient for agents reading your docs.

### Actionable
- **Pricing as data**: JSON with plan names, prices, billing intervals, feature lists per plan, usage limits, overage rates, trial availability. Agents comparing you to competitors need this structured.
- **Signup/trial endpoint**: Can an agent start a trial via API? If not, at minimum expose a direct signup URL (not a multi-step funnel).
- **API access**: Document how to get an API key programmatically. If it requires manual approval, say so.

### Gold standard: Stripe, Cloudflare

---

## Personal / Portfolio

### Discoverable
- **llms.txt**: Who you are, what you're known for, what you can help with. Think: if an agent is looking for someone with your skills, what should it find? Include: name, role, expertise areas, notable work, how to engage.
- **robots.txt**: Allow everything. You want maximum discoverability.
- **Sitemap**: Include all public pages. Even a one-page site benefits.

### Parseable
- **agents.json**: Name, also-known-as (important for people with name changes), expertise tags, projects list, contact methods.
- **JSON-LD**: `Person` schema with `sameAs` linking all profiles (LinkedIn, GitHub, X). `ProfilePage` type for the homepage.
- **Projects as structured data**: Each project with name, URL, description, role, tech stack.

### Actionable
- **Contact**: Structured email, cal.com link, LinkedIn URL. Not "reach out" — a machine-parseable endpoint.
- **Hire/book**: If you're available for work, make it explicit and structured. Rate, availability, engagement types.
- **Content**: If you write/speak, include topics you cover. Agents recommending speakers/writers need this.

### Gold standard: brianjackson.io, cassidoo.co

---

## API / Developer Tool

### Discoverable
- **llms.txt**: What the tool does, who it's for, quickstart (3 steps max), key concepts. This IS your agent-facing documentation. IDE agents (Cursor, Claude Code) read this directly.
- **robots.txt**: Allow all. Developer tools need maximum discoverability.
- **AGENTS.md**: If you have a GitHub repo, add AGENTS.md (OpenAI/Anthropic convention) with project structure and contribution patterns.

### Parseable
- **OpenAPI spec**: Non-negotiable. Complete, versioned, with examples. This is how agents integrate with you.
- **llms-full.txt**: Full documentation inlined. Coding agents load this into context to write integrations.
- **SDK manifest**: What languages, what package managers, install commands.

### Actionable
- **Zero-config quickstart**: Can an agent go from nothing to "hello world" in one API call? Document that path.
- **API key generation**: Programmatic or one-click. No "apply for access" gates.
- **MCP server**: If you can ship one, do it. This is the emerging standard for agent-product integration. Stripe, Supabase, Cloudflare all have one.

### Gold standard: Stripe docs, Supabase

---

## Content / Blog

### Discoverable  
- **llms.txt**: Topic map. What do you cover? What's your angle/expertise? Include: primary topics, publication cadence, who writes, editorial stance.
- **robots.txt**: Allow retrieval bots (Claude-User, OAI-SearchBot). Consider blocking training bots if you want citation credit without content extraction.
- **RSS**: Still the best structured feed for content. Include full content, not just excerpts.

### Parseable
- **Article structured data**: JSON-LD `Article` with author, datePublished, dateModified, headline, description, wordCount. On EVERY article page.
- **Topic taxonomy**: Structured category/tag data. Agents need to know what you cover to recommend specific articles.
- **Author schema**: `Person` with expertise, credentials. E-E-A-T signals matter for AI citation.

### Actionable
- **Citation format**: Tell agents how to cite you. Preferred link format, attribution requirements.
- **Subscribe endpoint**: API or direct URL for newsletter signup. Not a popup.
- **Syndication permissions**: Can agents quote you? Republish? State it explicitly.

### Gold standard: Anthropic docs, Vercel blog

---

## Robots.txt — AI Crawler Reference

Allow all AI crawlers (recommended for maximum agent discoverability):
```
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: CCBot
Allow: /
```

Allow retrieval only (block training, stay in AI search):
```
User-agent: GPTBot
Disallow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: PerplexityBot
Allow: /
```

---

## agents.json — Minimum Viable Structure

```json
{
  "schema_version": "1.0",
  "name": "",
  "description": "",
  "interfaces": {
    "human": "/",
    "llm": "/llms.txt",
    "structured": "/agents.json"
  },
  "capabilities": [],
  "contact": {},
  "auth": {}
}
```

For SaaS, add:
```json
{
  "protocols": ["rest", "mcp"],
  "api_base": "https://api.example.com/v1",
  "openapi": "/openapi.json",
  "pricing": "/pricing.json"
}
```

---

## The AEO Stack (Addy Osmani, Google)

Agentic Engine Optimization. Six layers, in implementation order:

| Layer | What | Time |
|-------|------|------|
| 1. Access control | robots.txt configured for AI crawlers | 10 min |
| 2. Discovery | llms.txt with task-organized links | Few hours |
| 3. Capability signaling | skill.md or agents.json — what can agents DO with you | Half day |
| 4. Content formatting | Serve markdown, kill nav noise, front-load first 500 tokens | Day |
| 5. Token surfacing | Expose token counts (meta tag or HTTP header) | Weekend |
| 6. "Copy for AI" | Button that copies clean Markdown to clipboard | Hours |

Key insight: agents compress multi-page navigation into 1-2 HTTP requests. All client-side analytics (scroll depth, time-on-page, clicks) become invisible.

### Token targets per doc type
- Quick start / getting started: < 15,000 tokens
- Individual API reference: < 25,000 tokens
- Full API reference: chunk by resource/endpoint, not by product
- Conceptual guides: < 20,000 tokens; link to detail rather than embed
- llms.txt itself: < 5,000 tokens

### Front-loading rule
First 500 tokens of any page should answer: what is this, what does it do, what do you need. Agents often truncate after initial assessment.

---

## AGENTS.md — The New README for Agents

60K+ AGENTS.md files on GitHub. Measured impact: 28% runtime reduction, 16% token reduction across 124 PRs (Gloaguen et al. 2026).

Put in repo root. Include:
- Project structure (key directories and their purpose)
- Documentation links
- Development sandboxes / environments
- Rate limits and constraints
- Patterns and conventions
- MCP server links (if applicable)

Warning: LLM-generated AGENTS.md files hurt agent success rates. Developer-written, minimal, precise files help (+4%). Write it yourself.

---

## Content-Signal Directives

Emerging robots.txt extension (contentsignals.org):
```
Content-Signal: search=yes, ai-input=yes, ai-train=no
```

Granular control beyond allow/disallow:
- `search=yes` — allow inclusion in AI search results
- `ai-input=yes` — allow as real-time context for agent queries
- `ai-train=no` — block use for model training

Can also be served as HTTP headers or meta tags.

---

## Effort Tiers (Implementation Timeline)

### Tier 1: Afternoon (zero code)
- Audit robots.txt, add AI crawler rules
- Content-Signal directives
- Write llms.txt (by hand, not generated)
- Add Link headers pointing to llms.txt
- Run scanners (agent-ready.dev, isitagentready.com, agentic-seo CLI)

### Tier 2: Day or two
- Write llms-full.txt (concatenated key docs)
- "Copy as Markdown" button on doc pages
- JSON-LD structured data on key pages
- OpenAPI spec at known endpoint

### Tier 3: Sprint
- Content negotiation (Accept: text/markdown returns markdown)
- Markdown sitemap
- Auto-generation pipeline (Mintlify, Fern, Context7)
- AGENTS.md in all repos

### Tier 4: Ongoing
- "Single-shot" doc quality test: can an agent complete the feature from the markdown alone? (Netlify's framework)
- Agent traffic monitoring (track AI referral sources)
- Token budget optimization per page
- Agent skills index (`.well-known/agent-skills/index.json`)

---

## Validation Tools

| Tool | What it checks | URL |
|------|---------------|-----|
| agent-ready.dev | Vercel's Agent Readability Spec (15 site-wide + 23 per-page checks) | agent-ready.dev |
| isitagentready.com | Cloudflare's Agent Readiness Score | isitagentready.com |
| agentic-seo CLI | Lightweight audit: llms.txt, robots.txt blocking, token counts, markdown availability | github.com/addyosmani/agentic-seo |

---

## DX vs AX: Key Divergences

What works for human developers breaks for agent users:

| Dimension | DX (humans) | AX (agents) |
|-----------|-------------|-------------|
| Onboarding | "Wow moment" gated by signup | Millisecond access, deploy-then-claim |
| Documentation | Scannable HTML with progressive disclosure | llms.txt, pure Markdown, zero nav noise |
| SDKs | Language-native libraries | Strict REST + OpenAPI (agents write own SDKs) |
| Defaults | Execute immediately | Dry-run first (opt in to mutation, not to safety) |
| Errors | Helpful prose messages | Structured codes with recovery instructions |
| Navigation | Progressive disclosure, breadcrumbs | Single context load, everything front-loaded |

---

## Common Mistakes

1. **llms.txt is just the homepage copy pasted** — Useless. Write for an agent that needs to decide whether to recommend you.
2. **robots.txt blocks all bots by default** — Many hosting platforms do this. Check.
3. **JSON-LD is only on the homepage** — Put it on EVERY page. Each page has its own type.
4. **Pricing exists only as HTML** — If an agent can't parse your pricing without rendering a browser, you're invisible to comparison.
5. **"Contact us" instead of structured contact** — An agent can't fill out a contact form. Give it an email, a cal link, or an API endpoint.
6. **OpenAPI spec is stale** — If your spec doesn't match your actual API, agents will generate broken integrations.
7. **No content negotiation** — Agents requesting `text/markdown` get HTML. Wastes tokens, degrades quality.
8. **LLM-generated AGENTS.md** — Hurts success rates. Write it yourself, keep it minimal and precise.
9. **No token awareness** — Pages exceeding 25K tokens get truncated or skipped. Surface counts, chunk appropriately.
10. **Visual hierarchy without text hierarchy** — Agents can't see your CSS. Heading structure and front-loaded content matter more than layout.
