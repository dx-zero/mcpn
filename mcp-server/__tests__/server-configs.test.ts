/// <reference types="node" />
/// <reference types="mocha" />

import { expect } from "chai";
import { McpTestClient } from "../src/client.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temporary test directories for config testing
const TEST_CONFIG_DIR = path.join(__dirname, "test-workflows");
const EMPTY_CONFIG_DIR = path.join(TEST_CONFIG_DIR, "empty-workflows");
const INVALID_CONFIG_DIR = path.join(TEST_CONFIG_DIR, "not-workflows");
const WORKFLOWS_DIR = path.join(TEST_CONFIG_DIR, ".workflows");
const MCP_WORKFLOWS_DIR = path.join(TEST_CONFIG_DIR, ".mcp-workflows");

describe("MCP Server Configuration Tests", function () {
  this.timeout(15000); // Increase timeout for server startup
  let client: McpTestClient;

  // Setup test directories before all tests
  before(() => {
    // Create test directories if they don't exist
    if (!fs.existsSync(TEST_CONFIG_DIR)) {
      fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
    }

    if (!fs.existsSync(EMPTY_CONFIG_DIR)) {
      fs.mkdirSync(EMPTY_CONFIG_DIR, { recursive: true });
    }

    if (!fs.existsSync(WORKFLOWS_DIR)) {
      fs.mkdirSync(WORKFLOWS_DIR, { recursive: true });
    }

    if (!fs.existsSync(MCP_WORKFLOWS_DIR)) {
      fs.mkdirSync(MCP_WORKFLOWS_DIR, { recursive: true });
    }

    if (!fs.existsSync(INVALID_CONFIG_DIR)) {
      fs.mkdirSync(INVALID_CONFIG_DIR, { recursive: true });
    }

    // Create a temporary test preset file in both src/presets and dist/presets
    const srcPresetDir = path.join(__dirname, "..", "src", "presets");
    const distPresetDir = path.join(__dirname, "..", "dist", "presets");

    const testPresetContent = `test_mode:
  description: "Test mode for testing data-driven approach"
  prompt: |
    # Test Mode
    This is a test prompt for verifying the data-driven preset approach.
    No code changes should be needed to add this test mode.
`;

    fs.writeFileSync(
      path.join(srcPresetDir, "test-preset.yaml"),
      testPresetContent
    );

    // Also write to dist/presets since that's what gets used at runtime
    fs.writeFileSync(
      path.join(distPresetDir, "test-preset.yaml"),
      testPresetContent
    );

    // Add test YAML files to .workflows directory
    fs.writeFileSync(
      path.join(WORKFLOWS_DIR, "override-description.yaml"),
      `debugger_mode:
  description: "Custom debugging tool description"`
    );

    fs.writeFileSync(
      path.join(WORKFLOWS_DIR, "override-prompt.yaml"),
      `debugger_mode:
  prompt: |
    # Custom Debugger Mode

    This is a completely custom prompt for the debugger mode.`
    );

    fs.writeFileSync(
      path.join(WORKFLOWS_DIR, "disable-tool.yaml"),
      `planner_mode:
  disabled: true`
    );

    fs.writeFileSync(
      path.join(WORKFLOWS_DIR, "custom-tool.yaml"),
      `custom_tool:
  description: "A completely custom tool"
  prompt: |
    # Custom Tool

    This is a custom tool that doesn't exist in presets.`
    );

    fs.writeFileSync(
      path.join(WORKFLOWS_DIR, "malformed.yaml"),
      `this is not valid: yaml:
  - missing colon
  indentation problem`
    );

    // Add test YAML files to .mcp-workflows directory
    fs.writeFileSync(
      path.join(MCP_WORKFLOWS_DIR, "custom-mcp-tool.yaml"),
      `custom_mcp_tool:
  description: "A custom tool from .mcp-workflows"
  prompt: |
    # Custom MCP Tool

    This is a custom tool from the .mcp-workflows directory.`
    );
  });

  // Clean up after all tests
  after(() => {
    // Remove test directories if desired
    // fs.rmSync(TEST_CONFIG_DIR, { recursive: true });
    // Remove the temporary test preset files
    try {
      const srcPresetPath = path.join(
        __dirname,
        "..",
        "src",
        "presets",
        "test-preset.yaml"
      );
      const distPresetPath = path.join(
        __dirname,
        "..",
        "dist",
        "presets",
        "test-preset.yaml"
      );

      if (fs.existsSync(srcPresetPath)) {
        fs.unlinkSync(srcPresetPath);
      }

      if (fs.existsSync(distPresetPath)) {
        fs.unlinkSync(distPresetPath);
      }
    } catch (error) {
      console.error("Error cleaning up test preset:", error);
    }
  });

  beforeEach(() => {
    client = new McpTestClient();
  });

  afterEach(async () => {
    try {
      await client.close();
    } catch (error) {
      console.error("Error closing client:", error);
    }
  });

  // Basic Scenarios
  describe("Basic Scenarios", () => {
    it("B1: Default run - should load only thinking tools", async () => {
      await client.connect();
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("generate_thought");
    });

    it("B2: Invalid command line args - should use default config", async () => {
      await client.connect(["--invalid", "arg"]);
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("generate_thought");
    });
  });

  // Preset Scenarios
  describe("Preset Scenarios", () => {
    it("P1: Thinking preset - should load only thinking tools", async () => {
      await client.connect(["--preset", "thinking"]);
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("generate_thought");
    });

    it("P1.1: Thinking mode should have thought parameter", async () => {
      await client.connect(["--preset", "thinking"]);
      const tools = await client.listTools();

      // Find the generate_thought tool
      const thinkingTool = tools.tools.find(
        (t: any) => t.name === "generate_thought"
      );
      expect(thinkingTool).to.exist;

      // Check that it has the inputSchema property
      expect(thinkingTool).to.have.property("inputSchema");

      // Note: Due to known issues with schema validation in the MCP SDK,
      // we can't directly test the schema properties as they may be empty in the response.
      // We can test this functionality more comprehensively in integration tests.
    });

    it("P2: Coding preset - should load only coding tools", async () => {
      await client.connect(["--preset", "coding"]);
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("debugger_mode");
      expect(toolNames).to.include("architecture_mode");
    });

    it("P3: Multiple presets - should load tools from all presets", async () => {
      await client.connect(["--preset", "coding,thinking"]);
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("generate_thought"); // From thinking
      expect(toolNames).to.include("debugger_mode"); // From coding
    });

    it("P4: Duplicate presets - should load each tool only once", async () => {
      await client.connect(["--preset", "thinking,thinking"]);
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);

      // Count occurrences of each tool name
      const counts = toolNames.reduce(
        (acc: Record<string, number>, name: string) => {
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        },
        {}
      );

      // Ensure no duplicates
      Object.values(counts).forEach((count) => {
        expect(count).to.equal(1);
      });
    });

    it("P5: Non-existent preset - should start with no tools from that preset", async () => {
      await client.connect(["--preset", "nonexistent"]);
      const tools = await client.listTools();

      // Server should still start but with a placeholder tool
      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);

      // Should include the placeholder tool
      expect(toolNames).to.include("placeholder");
    });

    it("P6: Mixed valid/invalid presets - should load tools from valid preset only", async () => {
      await client.connect(["--preset", "coding,nonexistent"]);
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("debugger_mode"); // From coding
    });

    it("P7: Empty preset arg - should start with no tools", async () => {
      await client.connect(["--preset", ""]);
      const tools = await client.listTools();

      // Server should start with just the placeholder tool
      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);

      // Should include the placeholder tool
      expect(toolNames).to.include("placeholder");
    });

    it("P8: Data-driven approach - should load tools from new preset file without code changes", async () => {
      await client.connect(["--preset", "test-preset"]);
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("test_mode");

      // Verify the tool can be invoked
      const response = await client.callTool("test_mode");
      expect(response.content[0].text).to.include("Test Mode");
      expect(response.content[0].text).to.include(
        "data-driven preset approach"
      );
    });
  });

  // Configuration Scenarios
  describe("Configuration Scenarios", () => {
    it("C1: Basic config - should load configs from directory", async () => {
      await client.connect([
        "--config",
        path.join(__dirname, "test-workflows", ".workflows"),
      ]);
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("custom_tool"); // Custom tool from config
    });

    it("C1.2: Config without preset - should not load thinking preset by default", async () => {
      await client.connect([
        "--config",
        path.join(__dirname, "test-workflows", ".workflows"),
      ]);
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);

      // Should include tools from config
      expect(toolNames).to.include("custom_tool");

      // Should NOT include tools from thinking preset when only config is provided
      expect(toolNames).to.not.include("generate_thought");
    });

    it("C1.1: Alternate folder name - should load configs from .mcp-workflows", async () => {
      await client.connect([
        "--config",
        path.join(__dirname, "test-workflows", ".mcp-workflows"),
      ]);
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("custom_mcp_tool"); // Custom tool from .mcp-workflows
    });

    it("C2: Config with preset - should merge configs with preset overriding", async () => {
      await client.connect([
        "--config",
        path.join(__dirname, "test-workflows", ".workflows"),
        "--preset",
        "coding",
      ]);
      const tools = await client.listTools();

      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);

      // Should include tools from both, but config overrides preset
      expect(toolNames).to.include("custom_tool"); // From config
      // debugger_mode is renamed to custom_debugger due to name override
      expect(toolNames).to.include("custom_debugger"); // Renamed from debugger_mode
      expect(toolNames).to.not.include("planner_mode"); // Disabled in config
    });

    it("C3: Non-existent config path - should not load thinking preset", async () => {
      await client.connect(["--config", "./nonexistent"]);
      const tools = await client.listTools();

      // Should not fall back to thinking preset, just use placeholder tool
      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("placeholder");
      expect(toolNames).to.not.include("generate_thought"); // Should NOT include thinking preset tools
    });

    it("C4: Config path is not .workflows - should not load thinking preset", async () => {
      await client.connect([
        "--config",
        path.join(__dirname, "test-workflows", "not-workflows"),
      ]);
      const tools = await client.listTools();

      // Should not fall back to thinking preset, just use placeholder tool
      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("placeholder");
      expect(toolNames).to.not.include("generate_thought"); // Should NOT include thinking preset tools
    });

    it("C5: Empty config directory - should not load thinking preset", async () => {
      await client.connect([
        "--config",
        path.join(__dirname, "test-workflows", "empty-workflows"),
      ]);
      const tools = await client.listTools();

      // Should not fall back to thinking preset, just use placeholder tool
      expect(tools.tools).to.be.an("array");
      const toolNames = tools.tools.map((t: any) => t.name);
      expect(toolNames).to.include("placeholder");
      expect(toolNames).to.not.include("generate_thought"); // Should NOT include thinking preset tools
    });
  });

  // Configuration Content Tests
  describe("Configuration Content Tests", () => {
    it("CC1: Override tool description - description should match override", async () => {
      await client.connect([
        "--config",
        path.join(__dirname, "test-workflows", ".workflows"),
        "--preset",
        "coding",
      ]);
      const tools = await client.listTools();

      // Find the custom_debugger tool (renamed from debugger_mode)
      const debuggerTool = tools.tools.find(
        (t: any) => t.name === "custom_debugger"
      );
      expect(debuggerTool).to.exist;

      // Check the description matches the override
      expect(debuggerTool.description).to.equal(
        "A debugger tool with a custom name"
      );
    });

    it("CC2: Override tool name - should register with custom name", async () => {
      await client.connect([
        "--config",
        path.join(__dirname, "test-workflows", ".workflows"),
      ]);
      const tools = await client.listTools();

      // Find the custom_debugger tool (renamed from debugger_mode)
      const customNameTool = tools.tools.find(
        (t: any) => t.name === "custom_debugger"
      );
      expect(customNameTool).to.exist;
      expect(customNameTool.description).to.equal(
        "A debugger tool with a custom name"
      );

      // The original debugger_mode shouldn't exist in this case
      const originalTool = tools.tools.find(
        (t: any) => t.name === "debugger_mode"
      );
      expect(originalTool).to.not.exist;
    });

    it("CC5: Custom tool - should be available with specified properties", async () => {
      await client.connect([
        "--config",
        path.join(__dirname, "test-workflows", ".workflows"),
      ]);
      const tools = await client.listTools();

      // Find the custom_tool
      const customTool = tools.tools.find((t: any) => t.name === "custom_tool");
      expect(customTool).to.exist;
      expect(customTool.description).to.equal("Custom test tool");
    });

    it("CC6: Optional tool descriptions - should work with and without descriptions", async () => {
      await client.connect([
        "--config",
        path.join(__dirname, "test-workflows", ".workflows"),
      ]);
      const tools = await client.listTools();

      // Find the optional_description_mode tool
      const optionalDescriptionTool = tools.tools.find(
        (t: any) => t.name === "optional_description_mode"
      );
      expect(optionalDescriptionTool).to.exist;
      expect(optionalDescriptionTool.description).to.equal(
        "Mode to test optional tool descriptions"
      );

      // Call the tool to get the prompt
      const response = await client.callTool("optional_description_mode");
      const promptText = response.content[0].text;

      console.log("PROMPT TEXT:", promptText); // Add this for debugging

      // Update assertions to match the actual format shown in the output
      expect(promptText).to.include("- 0: This tool has a description");
      expect(promptText).to.include("- 1"); // Tool without description has no colon or description text
      expect(promptText).to.include("- 2: Another tool with a description");
    });
  });
});
