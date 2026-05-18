import { existsSync, readFileSync } from "fs";
import { join } from "path";

export function generateAgentsJson(check, scanResult, dir) {
  const { siteType, target } = scanResult;

  const hostname = extractHostname(target);
  const name = inferName(dir, hostname);

  const manifest = {
    schema_version: "1.0",
    name,
    description: "",
    url: target || "",
    site_type: siteType,
    interfaces: {
      human: "/",
      llm: "/llms.txt",
      structured: "/.well-known/agent.json",
    },
    capabilities: getCapabilities(siteType),
    contact: {},
  };

  if (siteType === "saas" || siteType === "api") {
    manifest.api_base = "";
    manifest.openapi = "/openapi.json";
    manifest.protocols = ["rest"];
  }

  return {
    file: ".well-known/agent.json",
    description: `Agent manifest for ${siteType} site — fill in description and contact`,
    draft: true,
    content: JSON.stringify(manifest, null, 2) + "\n",
  };
}

function getCapabilities(siteType) {
  switch (siteType) {
    case "saas":
      return ["pricing-lookup", "api-integration", "trial-signup"];
    case "api":
      return ["api-integration", "sdk-install", "docs-lookup"];
    case "content":
      return ["content-search", "topic-lookup", "citation"];
    case "personal":
      return ["contact", "expertise-lookup", "project-listing"];
    default:
      return [];
  }
}

function extractHostname(target) {
  if (!target) return null;
  try {
    return new URL(target).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

function inferName(dir, hostname) {
  const pkgPath = join(dir, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      if (pkg.name) return pkg.name;
    } catch {}
  }
  if (hostname) return hostname.split(".")[0];
  return "";
}
