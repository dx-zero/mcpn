import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { McpTestClient } from "../src/client.js";

describe("MCP Client Tests", () => {
	let client: McpTestClient;

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

	it("should connect to server with default configuration", async () => {
	await client.connect();
	const tools = await client.listTools();

	// When no args provided, default preset is "thinking", so it should include generate_thought
	expect(Array.isArray(tools.tools)).toBe(true);
	const toolNames = tools.tools.map((t: any) => t.name);
	expect(toolNames).toContain("generate_thought");
	});

	it("should connect with specific preset", async () => {
	await client.connect(["--preset", "coding"]);
	const tools = await client.listTools();

	// Coding preset should include debugger_mode, planner_mode, etc.
	expect(Array.isArray(tools.tools)).toBe(true);
	const toolNames = tools.tools.map((t: any) => t.name);
	expect(toolNames).toContain("debugger_mode");
	expect(toolNames).toContain("planner_mode");
	expect(toolNames).toContain("architecture_mode");
	});

	it("should work with multiple presets", async () => {
	await client.connect(["--preset", "thinking,coding"]);
	const tools = await client.listTools();

	// Should have tools from both presets
	expect(Array.isArray(tools.tools)).toBe(true);
	const toolNames = tools.tools.map((t: any) => t.name);
	expect(toolNames).toContain("generate_thought"); // from thinking
	expect(toolNames).toContain("debugger_mode"); // from coding
	});
});