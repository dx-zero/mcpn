import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ZodSchemaMap } from "./@types/common";
import type { TemplateParams } from "./@types/common";
import type { DevToolsConfig, PromptConfig } from "./@types/config";
import type { ToolCallback, ToolResult } from "./@types/tool";
import {
	convertParametersToZodSchema,
	loadConfigSync,
	mergeConfigs,
	validateToolConfig,
} from "./config";
import { listAvailablePresets, loadPresetConfigs } from "./preset";
import { promptFunctions } from "./prompts";
import {
	appendFormattedTools,
	formatToolsList,
	processTemplate,
} from "./utils";

/**
 * Loads and merges configuration from presets and user config
 * @param presets - Array of preset names to load
 * @param configPath - Optional path to user config
 */
export function loadAndMergeConfig(
	presets: string[],
	configPath?: string,
): DevToolsConfig {
	// Log available presets
	const availablePresets = listAvailablePresets();
	console.error(`Available presets: ${availablePresets.join(", ")}`);
	console.error(`Using presets: ${presets.join(", ")}`);

	// 1. Load preset configs
	const presetConfig = loadPresetConfigs(presets);
	console.error(
		`Loaded ${Object.keys(presetConfig).length} tools from presets`,
	);

	// 2. Load user configs from .workflows directory if provided
	const userConfig = configPath ? loadConfigSync(configPath) : {};
	if (configPath) {
		console.error(
			`Loaded ${
				Object.keys(userConfig).length
			} tool configurations from user config directory: ${configPath}`,
		);
	}

	// 3. Merge configs (user config overrides preset config)
	const finalConfig = mergeConfigs(presetConfig, userConfig);
	console.error(
		`Final configuration contains ${Object.keys(finalConfig).length} tools`,
	);

	return finalConfig;
}

/**
 * Creates and configures the MCP server with tools from the provided configuration
 * @param config - The tool configuration object
 * @param version - Server version
 */
export function createMcpServer(
	config: DevToolsConfig,
	version: string,
): McpServer {
	// Create an MCP server
	const server = new McpServer(
		{
			name: "DevTools MCP",
			version: version,
		},
		{
			capabilities: {
				tools: {},
			},
		},
	);

	// Register all tools from the config
	registerToolsFromConfig(server, config);

	// If no tools were registered, add a dummy tool
	if (
		Object.keys(config).filter((key) => !config[key]?.disabled).length === 0
	) {
		console.error("No tools registered, adding placeholder tool");
		server.tool(
			"placeholder",
			"This is a placeholder tool when no other tools are loaded",
			async () => {
				return {
					content: [
						{
							type: "text",
							text: "No tools are currently configured",
						},
					],
				};
			},
		);
	}

	return server;
}

/**
 * Registers tools to the MCP server based on the provided configuration
 * @param server - The MCP server instance
 * @param config - The tool configuration object
 */
export function registerToolsFromConfig(
	server: McpServer,
	config: DevToolsConfig,
): void {
	// Function to add a tool if it's not disabled
	const addTool = (
		name: string,
		description: string,
		inputSchema: ZodSchemaMap | undefined,
		callback: ToolCallback,
	) => {
		server.tool(
			name,
			description,
			inputSchema || {},
			async (params: TemplateParams): Promise<ToolResult> => {
				try {
					// Log parameters for debugging
					console.error(`Tool ${name} called with params:`, params);

					// Validate tool configuration
					const validationError = validateToolConfig(config, name);
					if (validationError) {
						return {
							content: [{ type: "text", text: `Error: ${validationError}` }],
							isError: true,
						};
					}

					// Pass the params to the callback
					return callback(params);
				} catch (error) {
					// Improved error handling
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					console.error(`Error executing tool ${name}:`, errorMessage);
					return {
						content: [
							{
								type: "text",
								text: `Error executing tool: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
			},
		);
	};

	// Dynamically register all tools from the config
	for (const [key, toolConfig] of Object.entries(config)) {
		// Skip if toolConfig is undefined or disabled
		if (!toolConfig || toolConfig.disabled) {
			continue;
		}

		// Find corresponding prompt function if available
		const promptFunction = promptFunctions[key];

		// Use custom name if provided, otherwise use the key
		const toolName = toolConfig.name || key;

		// Convert parameters to Zod schema if provided
		let inputSchema = undefined;
		if (
			toolConfig.parameters &&
			Object.keys(toolConfig.parameters).length > 0
		) {
			// Use Zod schema instead of JSON Schema for better MCP SDK compatibility
			inputSchema = convertParametersToZodSchema(toolConfig.parameters);
			// Log the input schema for debugging
			console.error(
				`Tool ${toolName} input schema:`,
				JSON.stringify(Object.keys(inputSchema), null, 2),
			);
		}

		addTool(
			toolName,
			toolConfig.description || `${key.replace(/_/g, " ")} tool`,
			inputSchema,
			async (params?: TemplateParams): Promise<ToolResult> => {
				// Generate the tool prompt with template processing
				const { text, usedParams } = generateToolPrompt(
					key,
					toolConfig,
					promptFunction,
					config,
					params,
				);

				// Add unused parameters as JSON at the end
				let finalText = text;
				if (params && Object.keys(params).length > 0) {
					// Filter out used parameters
					const unusedParams: Record<string, any> = {};
					for (const [paramKey, value] of Object.entries(params)) {
						if (!usedParams.has(paramKey)) {
							unusedParams[paramKey] = value;
						}
					}

					// Only append if there are unused parameters
					if (Object.keys(unusedParams).length > 0) {
						finalText += `\n\nParameters: ${JSON.stringify(
							unusedParams,
							null,
							2,
						)}`;
					}
				}

				return { content: [{ type: "text", text: finalText }] };
			},
		);
	}
}

/**
 * Processes the template with parameters
 * @returns Object containing the processed text and set of used parameters
 */
function generateToolPrompt(
	key: string,
	toolConfig: PromptConfig,
	promptFunction:
		| ((config: DevToolsConfig, params?: TemplateParams) => string)
		| undefined,
	fullConfig: DevToolsConfig,
	params?: TemplateParams,
): { text: string; usedParams: Set<string> } {
	let basePrompt = "";

	// Get the base prompt text
	if (promptFunction) {
		basePrompt = promptFunction(fullConfig, params);
		// Since the prompt function already processed templates, return without further processing
		return {
			text: basePrompt,
			usedParams: params ? new Set(Object.keys(params)) : new Set(),
		};
	}
	if (toolConfig.prompt) {
		basePrompt = toolConfig.prompt;

		// Add context if provided
		if (toolConfig.context) {
			basePrompt += `\n\n${toolConfig.context}`;
		}

		// Add tools section if provided using utility function
		if (toolConfig.tools) {
			const toolsList = formatToolsList(toolConfig.tools);
			basePrompt = appendFormattedTools(
				basePrompt,
				toolsList,
				toolConfig.toolMode,
			);
		}
	} else {
		// No prompt available
		console.error(`Tool "${key}" has no prompt defined`);
		basePrompt = `# ${key}\n\nNo prompt defined for this tool.`;
	}

	// Process the template with parameters
	const processed = processTemplate(basePrompt, params || {});
	return { text: processed.result, usedParams: processed.usedParams };
}

/**
 * Starts the MCP server with the specified transport
 * @param server - The configured MCP server
 * @param presets - Array of preset names used
 * @param configPath - Optional path to user config
 */
export async function startServer(
	server: McpServer,
	presets: string[],
	configPath?: string,
): Promise<void> {
	const transport = new StdioServerTransport();
	try {
		await server.connect(transport);
		console.error(
			`DevTools MCP server running with presets: ${presets.join(", ")}${
				configPath ? ` and user config from: ${configPath}` : ""
			}`,
		);
	} catch (error_) {
		console.error("Error starting server:", error_);
	}
}
