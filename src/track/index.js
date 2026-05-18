import chalk from "chalk";

const PROVIDERS = {
  claude: {
    name: "Claude",
    url: "https://api.anthropic.com/v1/messages",
    envKey: "ANTHROPIC_API_KEY",
    model: "claude-sonnet-4-6",
    call: callClaude,
  },
  openai: {
    name: "ChatGPT",
    url: "https://api.openai.com/v1/chat/completions",
    envKey: "OPENAI_API_KEY",
    model: "gpt-4o-mini",
    call: callOpenAI,
  },
  google: {
    name: "Gemini",
    envKey: "GOOGLE_API_KEY",
    model: "gemini-2.0-flash",
    call: callGoogle,
  },
};

const DEFAULT_PROMPTS = [
  { template: "What is {company}?", category: "brand" },
  { template: "What does {company} do?", category: "brand" },
  { template: "Best {category} tools?", category: "discovery" },
];

export async function track(scanResult, config) {
  const company = config.company || inferCompany(scanResult);
  const category = config.category || "";
  const prompts = config.prompts || DEFAULT_PROMPTS;

  const available = getAvailableProviders();
  if (available.length === 0) {
    return null;
  }

  const rendered = prompts.map((p) => ({
    ...p,
    text: p.template
      .replace("{company}", company)
      .replace("{category}", category),
  }));

  const results = [];

  for (const prompt of rendered) {
    for (const provider of available) {
      try {
        const response = await provider.call(prompt.text, provider.model);
        results.push({
          provider: provider.name,
          prompt: prompt.text,
          category: prompt.category,
          response: response.slice(0, 500),
          mentions: response.toLowerCase().includes(company.toLowerCase()),
        });
      } catch {
        results.push({
          provider: provider.name,
          prompt: prompt.text,
          category: prompt.category,
          response: "(failed)",
          mentions: false,
        });
      }
    }
  }

  return results;
}

export function printTrackResults(results, company) {
  if (!results || results.length === 0) return;

  console.log(chalk.bold("\n  AI Visibility — what models say about you\n"));

  const grouped = {};
  for (const r of results) {
    if (!grouped[r.prompt]) grouped[r.prompt] = [];
    grouped[r.prompt].push(r);
  }

  for (const [prompt, responses] of Object.entries(grouped)) {
    console.log(chalk.dim(`  > "${prompt}"\n`));
    for (const r of responses) {
      const icon = r.mentions ? chalk.green("cited") : chalk.red("not cited");
      console.log(`    ${chalk.bold(r.provider)} [${icon}]`);
      const lines = r.response.split("\n").slice(0, 3);
      for (const line of lines) {
        console.log(chalk.dim(`    ${line.slice(0, 80)}`));
      }
      console.log("");
    }
  }

  const total = results.length;
  const cited = results.filter((r) => r.mentions).length;
  const rate = Math.round((cited / total) * 100);
  console.log(chalk.bold(`  Citation rate: ${cited}/${total} (${rate}%)\n`));
}

export function getAvailableProviders() {
  return Object.values(PROVIDERS).filter((p) => process.env[p.envKey]);
}

function inferCompany(scanResult) {
  const target = scanResult.target || "";
  try {
    return new URL(target).hostname.replace("www.", "").split(".")[0];
  } catch {
    return target.split("/").pop() || "unknown";
  }
}

async function callClaude(prompt, model) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function callOpenAI(prompt, model) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGoogle(prompt, model) {
  const key = process.env.GOOGLE_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
