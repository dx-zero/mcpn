import { describe, it, expect } from "vitest";
import { parseArgs } from "../src/utils/args";

describe("CLI flag parsing (parseArgs)", () => {
  it("parses --preset and --config correctly", () => {
    const out = parseArgs(["--preset", "coding,thinking", "--config", "./foo"]);
    expect(out.presets).toEqual(["coding", "thinking"]);
    expect(out.configPath?.endsWith("foo")).toBe(true);
  });

  it("defaults to the thinking preset when neither preset nor config is supplied", () => {
    const out = parseArgs([]);
    expect(out.presets).toEqual(["thinking"]);
    expect(out.configPath).toBeUndefined();
  });
});