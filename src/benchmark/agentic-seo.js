import { execSync } from "child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";

const KNOWN_FILES = [
  "robots.txt",
  "llms.txt",
  "llms-full.txt",
  "AGENTS.md",
  "CLAUDE.md",
  "skill.md",
  "agent-permissions.json",
  "agents.json",
  "sitemap.xml",
  ".well-known/ai-plugin.json",
];

async function fetchText(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseSitemapUrls(xml, baseUrl) {
  const urls = [];
  const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  for (const m of matches) {
    const loc = m[1].trim();
    if (loc.startsWith(baseUrl)) urls.push(loc);
  }
  return urls;
}

function urlToFilePath(url, baseUrl) {
  let path = new URL(url).pathname;
  if (path.endsWith("/")) path += "index.html";
  else if (!path.includes(".")) path += ".html";
  return path.replace(/^\//, "");
}

async function fetchSiteToDir(baseUrl) {
  const tempDir = mkdtempSync(join(tmpdir(), "aeo-"));

  for (const file of KNOWN_FILES) {
    const content = await fetchText(`${baseUrl}/${file}`);
    if (content) {
      const filePath = join(tempDir, file);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, content);
    }
  }

  const sitemap = await fetchText(`${baseUrl}/sitemap.xml`);
  if (!sitemap) return tempDir;

  const urls = parseSitemapUrls(sitemap, baseUrl);

  await Promise.all(
    urls.map(async (url) => {
      const path = urlToFilePath(url, baseUrl);
      if (KNOWN_FILES.includes(path)) return;

      const html = await fetchText(url);
      if (html) {
        const htmlPath = join(tempDir, path);
        mkdirSync(dirname(htmlPath), { recursive: true });
        writeFileSync(htmlPath, html);
      }

      const mdUrl = url
        .replace(/\.html$/, ".md")
        .replace(/\/?$/, (m) => (m === "/" ? "/index.md" : ".md"));
      if (mdUrl !== url) {
        const md = await fetchText(mdUrl);
        if (md) {
          const mdPath = join(tempDir, path.replace(/\.html$/, ".md"));
          mkdirSync(dirname(mdPath), { recursive: true });
          writeFileSync(mdPath, md);
        }
      }
    }),
  );

  return tempDir;
}

export async function runBenchmark(target) {
  let tempDir = null;

  try {
    let scanDir;

    if (target && target.startsWith("http")) {
      tempDir = await fetchSiteToDir(target);
      scanDir = tempDir;
    } else {
      scanDir = target || ".";
    }

    const output = execSync(`npx agentic-seo ${scanDir} --json`, {
      timeout: 60000,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const result = JSON.parse(output);
    return {
      score: result.score ?? result.percentage ?? 0,
      maxScore: 100,
      grade: result.grade || null,
      categories: result.categories || null,
      available: true,
    };
  } catch (err) {
    if (err.message?.includes("not found") || err.message?.includes("ENOENT")) {
      return {
        score: null,
        maxScore: 100,
        available: false,
        reason: "agentic-seo not installed",
      };
    }
    return {
      score: null,
      maxScore: 100,
      available: false,
      reason: err.message?.slice(0, 100),
    };
  } finally {
    if (tempDir) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
  }
}
