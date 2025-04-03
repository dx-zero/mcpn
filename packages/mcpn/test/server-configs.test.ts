import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeAll, afterAll, beforeEach, afterEach, expect } from "vitest";
import { McpTestClient } from "../src/client.js";

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temporary test directories for config testing
const TEST_CONFIG_DIR = path.join(__dirname, "test-workflows");
const EMPTY_CONFIG_DIR = path.join(TEST_CONFIG_DIR, "empty-workflows");
const INVALID_CONFIG_DIR = path.join(TEST_CONFIG_DIR, "not-workflows");
const WORKFLOWS_DIR = path.join(TEST_CONFIG_DIR, ".workflows");
const MCP_WORKFLOWS_DIR = path.join(TEST_CONFIG_DIR, ".mcp-workflows");

describe("MCP Server Configuration Tests", () => {
	let client: McpTestClient;

	beforeAll(() => {
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

	if (!fs.existsSync(srcPresetDir)) {
		fs.mkdirSync(srcPresetDir, { recursive: true });
	}
	if (!fs.existsSync(distPresetDir)) {
		fs.mkdirSync(distPresetDir, { recursive: true });
	}

	fs.writeFileSync(
		path.join(srcPresetDir, "test-preset.yaml"),
		testPresetContent
	);

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

	afterAll(() => {
	// Remove test directories if desired
	// Clean up temporary test preset files
	try {
		const srcPresetPath = path.join(__dirname, "..", "src", "presets", "test-preset.yaml");
		const distPresetPath = path.join(__dirname, "..", "dist", "presets", "test-preset.yaml");

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

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("generate_thought");
	});

	it("B2: Invalid command line args - should use default config", async () => {
		await client.connect(["--invalid", "arg"]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("generate_thought");
	});
	});

	// Preset Scenarios
	describe("Preset Scenarios", () => {
	it("P1: Thinking preset - should load only thinking tools", async () => {
		await client.connect(["--preset", "thinking"]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("generate_thought");
	});

	it("P1.1: Thinking mode should have thought parameter", async () => {
		await client.connect(["--preset", "thinking"]);
		const tools = await client.listTools();

		const thinkingTool = tools.tools.find((t: any) => t.name === "generate_thought");
		expect(thinkingTool).toBeTruthy();

		expect(thinkingTool).toHaveProperty("inputSchema");
	});

	it("P2: Coding preset - should load only coding tools", async () => {
		await client.connect(["--preset", "coding"]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("debugger_mode");
		expect(toolNames).toContain("architecture_mode");
	});

	it("P3: Multiple presets - should load tools from all presets", async () => {
		await client.connect(["--preset", "coding,thinking"]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("generate_thought"); // From thinking
		expect(toolNames).toContain("debugger_mode"); // From coding
	});

	it("P4: Duplicate presets - should load each tool only once", async () => {
		await client.connect(["--preset", "thinking,thinking"]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		const counts = toolNames.reduce(
		(acc: Record<string, number>, name: string) => {
			acc[name] = (acc[name] || 0) + 1;
			return acc;
		},
		{}
		);

		for (const count of Object.values(counts)) {
		expect(count).toBe(1);
		}
	});

	it("P5: Non-existent preset - should start with no tools from that preset", async () => {
		await client.connect(["--preset", "nonexistent"]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);

		expect(toolNames).toContain("placeholder");
	});

	it("P6: Mixed valid/invalid presets - should load tools from valid preset only", async () => {
		await client.connect(["--preset", "coding,nonexistent"]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("debugger_mode");
	});

	it("P7: Empty preset arg - should start with no tools", async () => {
		await client.connect(["--preset", ""]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);

		expect(toolNames).toContain("placeholder");
	});

	it("P8: Data-driven approach - should load tools from new preset file without code changes", async () => {
		await client.connect(["--preset", "test-preset"]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("test_mode");

		const response = await client.callTool("test_mode");
		expect(response.content[0].text).toContain("Test Mode");
		expect(response.content[0].text).toContain("data-driven preset approach");
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

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("custom_tool");
	});

	it("C1.2: Config without preset - should not load thinking preset by default", async () => {
		await client.connect([
		"--config",
		path.join(__dirname, "test-workflows", ".workflows"),
		]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);

		expect(toolNames).toContain("custom_tool");
		expect(toolNames).not.toContain("generate_thought");
	});

	it("C1.1: Alternate folder name - should load configs from .mcp-workflows", async () => {
		await client.connect([
		"--config",
		path.join(__dirname, "test-workflows", ".mcp-workflows"),
		]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("custom_mcp_tool");
	});

	it("C2: Config with preset - should merge configs with preset overriding", async () => {
		await client.connect([
		"--config",
		path.join(__dirname, "test-workflows", ".workflows"),
		"--preset",
		"coding",
		]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);

		expect(toolNames).toContain("custom_tool");
		expect(toolNames).toContain("custom_debugger");
		expect(toolNames).not.toContain("planner_mode");
	});

	it("C3: Non-existent config path - should not load thinking preset", async () => {
		await client.connect(["--config", "./nonexistent"]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("placeholder");
		expect(toolNames).not.toContain("generate_thought");
	});

	it("C4: Config path is not .workflows - should not load thinking preset", async () => {
		await client.connect([
		"--config",
		path.join(__dirname, "test-workflows", "not-workflows"),
		]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("placeholder");
		expect(toolNames).not.toContain("generate_thought");
	});

	it("C5: Empty config directory - should not load thinking preset", async () => {
		await client.connect([
		"--config",
		path.join(__dirname, "test-workflows", "empty-workflows"),
		]);
		const tools = await client.listTools();

		expect(Array.isArray(tools.tools)).toBe(true);
		const toolNames = tools.tools.map((t: any) => t.name);
		expect(toolNames).toContain("placeholder");
		expect(toolNames).not.toContain("generate_thought");
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

		const debuggerTool = tools.tools.find(
		(t: any) => t.name === "custom_debugger"
		);
		expect(debuggerTool).toBeTruthy();
		expect(debuggerTool.description).toBe(
		"A debugger tool with a custom name"
		);
	});

	it("CC2: Override tool name - should register with custom name", async () => {
		await client.connect([
		"--config",
		path.join(__dirname, "test-workflows", ".workflows"),
		]);
		const tools = await client.listTools();

		const customNameTool = tools.tools.find(
		(t: any) => t.name === "custom_debugger"
		);
		expect(customNameTool).toBeTruthy();
		expect(customNameTool.description).toBe(
		"A debugger tool with a custom name"
		);

		const originalTool = tools.tools.find(
		(t: any) => t.name === "debugger_mode"
		);
		expect(originalTool).toBeUndefined();
	});

	it("CC5: Custom tool - should be available with specified properties", async () => {
		await client.connect([
		"--config",
		path.join(__dirname, "test-workflows", ".workflows"),
		]);
		const tools = await client.listTools();

		const customTool = tools.tools.find((t: any) => t.name === "custom_tool");
		expect(customTool).toBeTruthy();
		expect(customTool.description).toBe("Custom test tool");
	});

	it("CC6: Optional tool descriptions - should work with and without descriptions", async () => {
		await client.connect([
		"--config",
		path.join(__dirname, "test-workflows", ".workflows"),
		]);
		const tools = await client.listTools();

		const optionalDescriptionTool = tools.tools.find(
		(t: any) => t.name === "optional_description_mode"
		);
		expect(optionalDescriptionTool).toBeTruthy();
		expect(optionalDescriptionTool.description).toBe(
		"Mode to test optional tool descriptions"
		);

		const response = await client.callTool("optional_description_mode");
		const promptText = response.content[0].text;

		// Check lines
		expect(promptText).toContain("- 0: This tool has a description");
		expect(promptText).toContain("- 1");
		expect(promptText).toContain("- 2: Another tool with a description");
	});
	});

	describe("New Tool Format Tests", () => {
	beforeEach(() => {
		fs.writeFileSync(
		path.join(WORKFLOWS_DIR, "string-tools.yaml"),
		`string_tools_config:
  description: "Config with string-based tools"
  tools: "tool1, tool2, tool3"
  prompt: |
	Test prompt with string tools list.`
		);

		fs.writeFileSync(
		path.join(WORKFLOWS_DIR, "object-tools.yaml"),
		`object_tools_config:
  description: "Config with object-based tools"
  tools:
    tool1: "Tool 1 description"
    tool2: 
      description: "Tool 2 description"
      prompt: "Tool 2 specific prompt"
    tool3:
      description: "Tool 3 description"
      optional: true
  prompt: |
	Test prompt with object-based tools.`
		);

		client = new McpTestClient();
	});

	afterEach(async () => {
		try {
		await client.close();

		const stringToolsPath = path.join(WORKFLOWS_DIR, "string-tools.yaml");
		const objectToolsPath = path.join(WORKFLOWS_DIR, "object-tools.yaml");

		if (fs.existsSync(stringToolsPath)) {
			fs.unlinkSync(stringToolsPath);
		}
		if (fs.existsSync(objectToolsPath)) {
			fs.unlinkSync(objectToolsPath);
		}
		} catch (error) {
		console.error("Error in test cleanup:", error);
		}
	});

	it("N1: Should support string-based tools format", async () => {
		await client.connect([
		"--config",
		path.join(__dirname, "test-workflows", ".workflows"),
		]);

		const tools = await client.listTools();
		const toolNames = tools.tools.map((t: any) => t.name);

		expect(
		tools.tools.some((t: any) =>
			t.description?.includes("string-based tools")
		)
		).toBe(true);
	});

	it("N2: Should support object-based tools format", async () => {
		await client.connect([
		"--config",
		path.join(__dirname, "test-workflows", ".workflows"),
		]);

		const tools = await client.listTools();
		const toolNames = tools.tools.map((t: any) => t.name);

		expect(
		tools.tools.some((t: any) =>
			t.description?.includes("object-based tools")
		)
		).toBe(true);
	});

	it("N3: Should support tools with prompt property", async () => {
		fs.writeFileSync(
		path.join(WORKFLOWS_DIR, "tool-prompts.yaml"),
		`tool_prompt_config:
  description: "Config with tool-specific prompts"
  tools:
    tool1:
      description: "Tool with custom prompt"
      prompt: "This is a custom prompt for tool1"
  prompt: |
	Base prompt.`
		);

		try {
		await client.connect([
			"--config",
			path.join(__dirname, "test-workflows", ".workflows"),
		]);

		const response = await client.getPrompt("tool_prompt_config");
		expect(response.content[0].text).toContain(
			"This is a custom prompt for tool1"
		);
		} finally {
		const toolPromptsPath = path.join(WORKFLOWS_DIR, "tool-prompts.yaml");
		if (fs.existsSync(toolPromptsPath)) {
			fs.unlinkSync(toolPromptsPath);
		}
		}
	});

	it("N4: Should support optional tools flag", async () => {
		fs.writeFileSync(
		path.join(WORKFLOWS_DIR, "optional-tools.yaml"),
		`optional_tools_config:
  description: "Config with optional tools"
  tools:
    required_tool:
      description: "Required tool"
    optional_tool:
      description: "Optional tool"
      optional: true
  prompt: |
	Base prompt with optional tools.`
		);

		try {
		await client.connect([
			"--config",
			path.join(__dirname, "test-workflows", ".workflows"),
		]);

		const response = await client.getPrompt("optional_tools_config");
		expect(response.content[0].text).toContain("Optional tool");
		expect(response.content[0].text).toContain("(Optional)");
		} finally {
		const optionalToolsPath = path.join(
			WORKFLOWS_DIR,
			"optional-tools.yaml"
		);
		if (fs.existsSync(optionalToolsPath)) {
			fs.unlinkSync(optionalToolsPath);
		}
		}
	});
	});
});