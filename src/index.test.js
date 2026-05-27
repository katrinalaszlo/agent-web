import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scan, getHistory } from "../src/index.js";

describe("module exports", () => {
  it("exports scan as a function", () => {
    assert.strictEqual(typeof scan, "function");
  });

  it("exports getHistory as a function", () => {
    assert.strictEqual(typeof getHistory, "function");
  });

  it("getHistory returns empty scans for nonexistent dir", () => {
    const result = getHistory("/tmp/aeo-ready-nonexistent-" + Date.now());
    assert.deepStrictEqual(result, { scans: [] });
  });
});
