const DEFAULT_TIMEOUT = 10000;
const USER_AGENT = "aeo-ready/1.3 (AEO benchmark aggregator)";

export async function fetchUrl(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    opts.timeout || DEFAULT_TIMEOUT,
  );

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        ...opts.headers,
      },
      redirect: "follow",
    });
    const text = await res.text();
    return {
      status: res.status,
      text,
      headers: Object.fromEntries(res.headers),
    };
  } catch (err) {
    if (err.name === "AbortError") {
      return { status: 0, text: "", headers: {}, error: "timeout" };
    }
    return { status: 0, text: "", headers: {}, error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}

export function resolveUrl(base, path) {
  try {
    return new URL(path, base).href;
  } catch {
    return null;
  }
}
