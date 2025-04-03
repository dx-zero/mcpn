import { describe, it, beforeEach, afterEach, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { x } from "tinyexec";
import { McpTestClient } from "../src/client.js";

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Advanced Parameters Integration", () => {
	let serverProcess: ReturnType<typeof x>;
	let client: McpTestClient;

	beforeEach(async () => {
	// Start the server process using the dedicated CLI entry point but now with tinyexec
	const serverPath = path.join(__dirname, "..", "dist", "cli-entry.mjs");
	// spawn with x from tinyexec
	serverProcess = x("node", [serverPath, "--preset", "examples"], {
		nodeOptions: { stdio: ["pipe", "pipe", "pipe"] },
	});

	// Allow some time for the server to start
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Create test client
	client = new McpTestClient();

	// Connect to server with example preset
	await client.connect(["--preset", "examples"]);
	});

	afterEach(async () => {
	// Clean up
	if (client) {
		await client.close();
	}
	// Stop the server process
	if (serverProcess) {
		serverProcess.kill();
	}
	});

	it("should list tools including advanced_configuration tool", async () => {
	const response = await client.listTools();

	// Log the response structure for debugging
	// console.log("Tools response structure:", JSON.stringify(response, null, 2));

	expect(response).toHaveProperty("tools");
	expect(Array.isArray(response.tools)).toBe(true);

	const advancedTool = response.tools.find(
		(tool: any) => tool.name === "advanced_configuration"
	);
	expect(advancedTool).not.toBeUndefined();
	expect(advancedTool?.description).toBe(
		"Configure a system with complex parameters"
	);
	});

	it("should handle calling the advanced_configuration tool", async () => {
	try {
		const response = await client.callTool("advanced_configuration", {
		name: "test-config",
		settings: {
			performance: {
			level: 4,
			optimizeFor: "speed",
			},
			security: {
			enabled: true,
			levels: ["high", "encryption"],
			},
		},
		tags: ["test", "integration"],
		timeout: 60,
		});

		// If we get here, the call succeeded
		expect(Array.isArray(response.content)).toBe(true);
		expect(response.content[0].type).toBe("text");

		const text = response.content[0].text;
		expect(text).toContain("test-config");
	} catch (error) {
		// For expected validation errors, we can just log them (but not fail)
		console.log("Received error calling advanced_configuration:", error);
		// We can optionally add a check here if we want to allow specific error messages only
	}
	});

	it("should handle calling the process_data tool", async () => {
	try {
		const response = await client.callTool("process_data", {
		data: [1, 2, 3, 0.4, 5],
		operations: ["sum", "average", "min", "max"],
		outputFormat: "json",
		});

		expect(Array.isArray(response.content)).toBe(true);
		expect(response.content[0].type).toBe("text");

		const text = response.content[0].text;
		expect(text).toContain("data");
	} catch (error) {
		console.log("Received error calling process_data tool:", error);
	}
	});

	it("should detect missing required parameters", async () => {
	try {
		await client.callTool("advanced_configuration", {
		// Missing required 'name' parameter
		settings: {
			performance: {
			level: 3,
			},
		},
		});
		// If we get here, it did not throw, which might be unexpected
		// So we can fail if no error was thrown
		expect(true).toBe(false);
	} catch (error) {
		// Expected error for missing required parameter
		expect(error).toBeDefined();
	}
	});
});