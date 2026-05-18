#!/usr/bin/env node

import { Command } from "commander";
import { scan } from "../src/scan.js";
import { fix } from "../src/fix/index.js";
import {
  track,
  printTrackResults,
  getAvailableProviders,
} from "../src/track/index.js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf8"),
);

const program = new Command();

program
  .name("aeo-ready")
  .description("Is your site AEO ready? Two scorecards, one score.")
  .version(pkg.version);

program
  .command("scan [url]")
  .description("Run a full audit (Agent Readiness + AI Visibility)")
  .option("--fix", "Fix issues and show before/after")
  .option("--track", "Query AI models to see what they say about you")
  .option("--company <name>", "Company name for --track")
  .option("--category <cat>", "Industry category for --track")
  .option("--json", "Output results as JSON")
  .option(
    "--threshold <number>",
    "Minimum score to pass (exit 1 if below)",
    parseInt,
  )
  .option("--no-benchmark", "Skip agentic-seo benchmark")
  .action(async (url, opts) => {
    try {
      const isUrl = url && url.startsWith("http");
      const dir = isUrl ? null : process.cwd();
      const quiet = opts.fix && dir;
      const result = await scan({
        url: isUrl ? url : null,
        dir,
        json: opts.json || quiet,
        benchmark: quiet ? false : opts.benchmark !== false,
      });

      if (opts.track) {
        const providers = getAvailableProviders();
        if (providers.length === 0) {
          console.log("\n  --track needs API keys. Set one or more:");
          console.log("    ANTHROPIC_API_KEY  (Claude)");
          console.log("    OPENAI_API_KEY     (ChatGPT)");
          console.log("    GOOGLE_API_KEY     (Gemini)\n");
        } else {
          const trackResults = await track(result, {
            company: opts.company || null,
            category: opts.category || null,
          });
          printTrackResults(trackResults, opts.company);
        }
      }

      if (opts.fix && dir) {
        const rescan = () =>
          scan({ url: null, dir, json: true, benchmark: false });
        await fix(result, dir, rescan);
      } else if (opts.fix && !dir) {
        console.log(
          "\n  --fix requires repo mode (no --url). Files are written to current directory.\n",
        );
      }

      if (opts.json) {
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
      }

      if (opts.threshold && result.score < opts.threshold) {
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Create .agent-web/config.yaml for citation tracking")
  .action(() => {
    console.log("Coming in v2.0 — citation tracking config");
  });

program
  .command("history")
  .description("List past scan results")
  .action(() => {
    console.log("Coming in v1.2 — scan history");
  });

program.parse();
