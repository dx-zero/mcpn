import * as fs from "node:fs";
import * as path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import { runCli } from "../../src/cli/cli.js";
import { parseArgs } from "../../src/cli/command-parser.js";
import { McpTestClient } from "../../src/client.js";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Default Server Command", () => {
	let client: McpTestClient;

	beforeEach(() => {
		client = new McpTestClient();
	});

	afterEach(async () => {
		try {
			await client.close();
		} catch {
			// Ignore errors during close
		}
	});

	it("should start server with default configuration when no command is provided", async () => {
		// Use the client to connect to the server with no arguments
		await client.connect();

		// Verify connection works and we can list tools
		const response = await client.listTools();
		expect(response).to.have.property("tools").that.is.an("array").that.is.not
			.empty;

		// Verify that at least the thinking preset is loaded
		// Try to call a tool that would be in the thinking preset
		const result = await client.callTool("generate_thought", {
			thought: "Test thought",
		});
		expect(result).to.have.property("content").that.is.an("array");
	});

	it("should start server with specified preset", async () => {
		// Connect with a specific preset
		await client.connect(["--preset", "thinking"]);

		// Verify we can access the thinking preset tools
		const response = await client.listTools();
		expect(response).to.have.property("tools").that.is.an("array").that.is.not
			.empty;
		expect(response.tools.some((t: any) => t.name === "generate_thought")).to.be
			.true;
	});

	it("should handle --config flag correctly", async function () {
		// Create a temporary test config
		const configDir = path.join(__dirname, "../temp-test-config");

		// Skip if we can't run this test due to file system access
		if (!fs.existsSync(configDir)) {
			try {
				fs.mkdirSync(configDir, { recursive: true });
			} catch {
				console.log("Skipping config test due to filesystem restrictions");
				this.skip();
				return;
			}
		}

		try {
			// Connect with config flag
			await client.connect(["--config", configDir]);

			// We should still be able to get tools even with an empty config
			const response = await client.listTools();
			expect(response).to.have.property("tools").that.is.an("array");
		} finally {
			// Clean up if we created the directory
			if (fs.existsSync(configDir)) {
				try {
					fs.rmdirSync(configDir, { recursive: true });
				} catch {
					console.log("Failed to clean up test config directory");
				}
			}
		}
	});

	it("should verify commands prevent server startup via runCli", async () => {
		// Test with command line args that include a command
		const result = await runCli(["init"], true); // Use mock mode

		expect(result.mode).to.equal("command");
		expect(result.command).to.equal("init");
	});

	it("should start server when no command is specified via runCli", async () => {
		const result = await runCli([], true); // Use mock mode

		expect(result.mode).to.equal("server");
		expect(result.presets).to.deep.equal(["thinking"]);
	});

	it("should maintain backward compatibility with existing flags via runCli", async () => {
		const result = await runCli(
			["--config", "path/to/config", "--preset", "thinking,coding"],
			true,
		);

		expect(result.mode).to.equal("server");
		expect(result.presets).to.deep.equal(["thinking", "coding"]);
		expect(result.configPath).to.equal("path/to/config");
	});
});
