export function detectSiteType(signals) {
  const { html, files, url } = signals;
  const text = (html || "").toLowerCase();
  const fileList = (files || []).map((f) => f.toLowerCase());

  const scores = {
    saas: scoreSaas(text, fileList, url),
    api: scoreApi(text, fileList, url),
    content: scoreContent(text, fileList, url),
    personal: scorePersonal(text, fileList, url),
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return "unknown";
  return sorted[0][0];
}

function scoreSaas(text, files, url) {
  let score = 0;
  if (text.includes("/pricing") || text.includes("/plans")) score += 3;
  if (text.includes("pricing") && !text.includes("/pricing")) score += 1;
  if (text.includes("sign up") || text.includes("signup")) score += 2;
  if (text.includes("free trial") || text.includes("start free")) score += 2;
  if (text.includes("dashboard") && text.includes("login")) score += 2;
  if (text.includes("per month") || text.includes("/mo")) score += 2;
  if (files.some((f) => f.includes("pricing"))) score += 2;
  return score;
}

function scoreApi(text, files, url) {
  let score = 0;
  const hostname = extractHostname(url);
  if (
    hostname &&
    (hostname.startsWith("docs.") || hostname.startsWith("developer."))
  )
    score += 4;
  if (text.includes("api reference") || text.includes("api docs")) score += 3;
  if (text.includes("sdk") || text.includes("client library")) score += 2;
  if (text.includes("openapi") || text.includes("swagger")) score += 3;
  if (text.includes("endpoint") || text.includes("authentication")) score += 1;
  if (text.includes("npm install") || text.includes("pip install")) score += 2;
  if (files.some((f) => f.includes("openapi") || f.includes("swagger")))
    score += 3;
  if (files.some((f) => f.includes("sdk") || f.includes("client"))) score += 1;
  return score;
}

function scoreContent(text, files, url) {
  let score = 0;
  if (text.includes("/blog") || text.includes("blog")) score += 2;
  if ((text.match(/article/g) || []).length >= 3) score += 2;
  if (text.includes("published") && text.includes("author")) score += 2;
  if (text.includes("read more") || text.includes("continue reading"))
    score += 2;
  if (text.includes("subscribe") && text.includes("newsletter")) score += 1;
  if (files.some((f) => f.includes("blog") || f.includes("posts"))) score += 3;
  if (files.filter((f) => f.endsWith(".md")).length > 10) score += 1;
  return score;
}

function scorePersonal(text, files, url) {
  let score = 0;
  const hostname = extractHostname(url);
  if (hostname && isPersonalDomain(hostname)) score += 3;
  if (text.includes("portfolio") || text.includes("my work")) score += 3;
  if (
    text.includes("about me") ||
    text.includes("i am") ||
    text.includes("i'm a")
  )
    score += 3;
  if (text.includes("resume") || text.includes("cv")) score += 2;
  if (text.includes("hire me") || text.includes("available for")) score += 2;
  if (text.includes("linkedin.com/in/") || text.includes("github.com/"))
    score += 1;
  if (text.includes("@") && text.includes("contact")) score += 1;
  return score;
}

function extractHostname(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

function isPersonalDomain(hostname) {
  const parts = hostname.split(".");
  const name = parts[0];
  const tld = parts.slice(1).join(".");
  const personalTlds = ["com", "me", "io", "dev", "co", "net", "org"];
  if (!personalTlds.includes(tld)) return false;
  return /^[a-z]+[a-z]+$/.test(name) && name.length >= 6 && name.length <= 20;
}

export const SITE_TYPES = ["saas", "api", "content", "personal", "unknown"];
