import { existsSync, readFileSync } from "fs";
import { join } from "path";

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "Google-Extended",
  "PerplexityBot",
  "Meta-ExternalAgent",
  "CCBot",
];

export function generateRobotsTxt(check, scanResult, dir) {
  const filePath = join(dir, "robots.txt");
  const exists = existsSync(filePath);

  if (exists) {
    return {
      file: "robots.txt",
      description: "Add missing AI crawler rules",
      draft: false,
      merge: mergeRobotsTxt,
      content: generateCrawlerBlock(),
    };
  }

  return {
    file: "robots.txt",
    description: "Allow all AI crawlers for maximum agent discoverability",
    draft: false,
    content: generateFullRobotsTxt(),
  };
}

function mergeRobotsTxt(existing, newContent) {
  const presentBots = AI_CRAWLERS.filter((bot) => existing.includes(bot));
  const missingBots = AI_CRAWLERS.filter((bot) => !existing.includes(bot));

  if (missingBots.length === 0) return existing;

  const additions = missingBots
    .map((bot) => `User-agent: ${bot}\nAllow: /\n`)
    .join("\n");

  return (
    existing.trimEnd() + "\n\n# AI crawlers (added by agent-web)\n" + additions
  );
}

function generateCrawlerBlock() {
  return AI_CRAWLERS.map((bot) => `User-agent: ${bot}\nAllow: /\n`).join("\n");
}

function generateFullRobotsTxt() {
  let content = "User-agent: *\nAllow: /\n\n";
  content += "# AI crawlers — explicit allow for agent discoverability\n";
  content += AI_CRAWLERS.map((bot) => `User-agent: ${bot}\nAllow: /\n`).join(
    "\n",
  );
  return content;
}
