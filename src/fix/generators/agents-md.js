import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

export function generateAgentsMd(check, scanResult, dir) {
  const { siteType, target } = scanResult;
  const name = inferName(dir);
  const structure = inferStructure(dir);

  const content = `# ${name || "[Project Name]"}

> [One sentence: what this project does]

## Project structure

${structure || "```\n[Add key directories and their purpose]\n```"}

## Key files

- Entry point: [path]
- Config: [path]
- API routes: [path]

## Development

\`\`\`bash
[install command]
[run command]
\`\`\`

## Conventions

- [Language/framework convention 1]
- [Language/framework convention 2]

## Constraints

- [Rate limits, auth requirements, etc]
- [External dependencies]
`;

  return {
    file: "AGENTS.md",
    description: "Draft AGENTS.md — REVIEW AND EDIT with real project details",
    draft: true,
    content,
  };
}

function inferName(dir) {
  const pkgPath = join(dir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      return JSON.parse(readFileSync(pkgPath, "utf8")).name || "";
    } catch {}
  }
  const pomPath = join(dir, "pom.xml");
  if (existsSync(pomPath)) {
    const pom = readFileSync(pomPath, "utf8");
    const match = pom.match(/<artifactId>([^<]+)<\/artifactId>/);
    if (match) return match[1];
  }
  return "";
}

function inferStructure(dir) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    const dirs = entries
      .filter(
        (e) =>
          e.isDirectory() &&
          !e.name.startsWith(".") &&
          e.name !== "node_modules",
      )
      .map((e) => e.name)
      .slice(0, 10);

    if (dirs.length === 0) return null;

    const lines = dirs.map((d) => `${d}/`);
    return "```\n" + lines.join("\n") + "\n```";
  } catch {
    return null;
  }
}
