import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { McpTestClient } from "@mcpn/test-utils";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

// Resolve the CLI entry point no matter where this test file lives
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliEntryPointPath = path.resolve(__dirname, "../../../cli/bin/mcpn.mjs");

// ────────────────────────────────────────────────────────────────────────────
// Test fixture setup
// ────────────────────────────────────────────────────────────────────────────

// We create a temporary folder that will act as the user’s config directory
const tempRoot = fs.mkdtempSync(path.join(tmpdir(), "mcpn-preset-"));
const userPresetsDir = path.join(tempRoot, ".mcp-workflows");
fs.mkdirSync(userPresetsDir, { recursive: true });

/**
 * 1) A brand‑new preset that exists only in the user directory.
 */
const CUSTOM_PRESET_NAME = "local";
const customPresetYaml = `
echo_tool:
  description: "Echo back the provided text"
  parameters:
    text:
      type: "string"
      description: "Text to echo"
      required: true
  prompt: "Echo: {{ text }}"
`;
fs.writeFileSync(
  path.join(userPresetsDir, `${CUSTOM_PRESET_NAME}.yaml`),
  customPresetYaml.trimStart(),
);

/**
 * 2) Override YAML for the built‑in "coding" preset. We change the
 *    description of debugger_mode so we can assert the override worked.
 */
const overrideCodingYaml = `
debugger_mode:
  description: "OVERRIDDEN DESCRIPTION FOR TEST"
  prompt: "This is a test prompt"
`;
fs.writeFileSync(
  path.join(userPresetsDir, "coding.yaml"),
  overrideCodingYaml.trimStart(),
);

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────
describe("Preset loading from a user .mcp‑workflows directory", () => {
  let client: McpTestClient;

  beforeAll(async () => {
    client = new McpTestClient({ cliEntryPoint: cliEntryPointPath });
    await client.connectServer([
      "--preset",
      CUSTOM_PRESET_NAME,
      "--config",
      userPresetsDir,
    ]);
  }, 15000);

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  }, 15000);

  it("loads a preset that exists only in the user directory", async () => {
    const tools = await client.listTools();
    const toolNames = tools.tools.map((t: any) => t.name);
    expect(toolNames).toContain("echo_tool");
  });
});

describe("User YAML overrides the built in preset definitions", () => {
  let client: McpTestClient;

  beforeAll(async () => {
    client = new McpTestClient({ cliEntryPoint: cliEntryPointPath });
    await client.connectServer([
      "--preset",
      "coding",
      "--config",
      userPresetsDir,
    ]);
  }, 15000);

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  }, 15000);

  it("prefers the user defined YAML over the built in one", async () => {
    const tools = await client.listTools();
    const overridden = tools.tools.find(
      (t: any) => t.name === "debugger_mode",
    );
    expect(overridden).toBeDefined();
    expect(overridden.description).toBe("OVERRIDDEN DESCRIPTION FOR TEST");
  });
});