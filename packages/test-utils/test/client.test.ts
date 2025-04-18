import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { McpTestClient } from "../src/McpTestClient.js";
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve the CLI entry point path dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Go up three levels from test/ -> test-utils/ -> packages/ -> mcpn/
// Then down to packages/cli/bin/mcpn.mjs
const cliEntryPointPath = path.resolve(__dirname, '../../../packages/cli/bin/mcpn.mjs');

describe("MCP Client Tests", () => {
	let client: McpTestClient;

	beforeEach(() => {
		console.log("cliEntryPointPath", cliEntryPointPath);

		client = new McpTestClient({
			cliEntryPoint: cliEntryPointPath, // Use the dynamically resolved path
		});
	});

	afterEach(async () => {
	try {
		await client.close();
	} catch (error) {
		console.error("Error closing client:", error);
	}
	});

	it("should connect to server with default configuration", async () => {
	await client.connectServer();
	const tools = await client.listTools();

	// When no args provided, default preset is "thinking", so it should include generate_thought
	expect(Array.isArray(tools.tools)).toBe(true);
	const toolNames = tools.tools.map((t: any) => t.name);
	console.log("Available tools:", toolNames);
	expect(toolNames).toContain("generate_thought");
	});

	it("should connect with specific preset", async () => {
	await client.connectServer(["--preset", "coding"]);
	const tools = await client.listTools();

	// Coding preset should include debugger_mode, planner_mode, etc.
	expect(Array.isArray(tools.tools)).toBe(true);
	const toolNames = tools.tools.map((t: any) => t.name);
	expect(toolNames).toContain("debugger_mode");
	expect(toolNames).toContain("planner_mode");
	expect(toolNames).toContain("architecture_mode");
	});

	it("should work with multiple presets", async () => {
	await client.connectServer(["--preset", "thinking,coding"]);
	const tools = await client.listTools();

	// Should have tools from both presets
	expect(Array.isArray(tools.tools)).toBe(true);
	const toolNames = tools.tools.map((t: any) => t.name);
	expect(toolNames).toContain("generate_thought"); // from thinking
	expect(toolNames).toContain("debugger_mode"); // from coding
	});
});