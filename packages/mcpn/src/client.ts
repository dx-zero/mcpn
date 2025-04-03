/**
 * @fileoverview MCP test client for testing the MCP server
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { TemplateParams } from "./@types/common";

export class McpTestClient {
	private client: Client;
	private transport: StdioClientTransport | undefined;

	constructor() {
		this.client = new Client(
			{
				name: "devtools-mcp-test-client",
				version: "0.1.0",
			},
			{
				capabilities: {
					prompts: {},
					resources: {},
					tools: {
						list: {},
						call: {},
					},
				},
			},
		);
	}

	/**
	 * Start the MCP server with the given command line arguments
	 * @param args Additional arguments to pass to the server
	 */
	async connect(args: string[] = []): Promise<void> {
		// Create a new transport with the specified args
		this.transport = new StdioClientTransport({
			command: "node",
			args: ["dist/cli-entry.mjs", ...args],
		});

		// Connect the client to the transport
		await this.client.connect(this.transport);
		console.log("Connected to MCP server");
	}

	/**
	 * Close the connection to the server
	 */
	async close(): Promise<void> {
		if (this.transport) {
			await this.transport.close();
			console.log("Disconnected from MCP server");
			this.transport = undefined;
		} else {
			console.log("Transport not initialized, skipping close.");
		}
	}

	/**
	 * List all available tools
	 */
	async listTools(): Promise<unknown> {
		return await this.client.listTools();
	}

	/**
	 * Call a tool by name with the given arguments
	 * @param name Tool name
	 * @param args Tool arguments
	 */
	async callTool(name: string, args: TemplateParams = {}): Promise<unknown> {
		return await this.client.callTool({
			name,
			arguments: args,
		});
	}

	/**
	 * Get the prompt for a specific tool or configuration; used for testing
	 * @param name Name of the tool or configuration to get prompt for
	 * @returns Promise containing the prompt text
	 */
	async getPrompt(name: string): Promise<unknown> {
		// Call the tool with no arguments to get its prompt
		return await this.client.callTool({
			name,
			arguments: {},
		});
	}
}
