import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { promptFunctions } from "./prompts.js";
import {
  loadConfigSync,
  loadPresetConfigs,
  listAvailablePresets,
  mergeConfigs,
  validateToolConfig,
  convertParametersToJsonSchema,
  convertParametersToZodSchema,
} from "./config.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

// Define TypeScript interfaces for returned types
interface CommandLineArgs {
  configPath?: string;
  presets: string[];
}

/**
 * Gets the package version from package.json
 * @returns {Object} The parsed package.json content
 */
function getPackageInfo(): Record<string, any> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packageJsonPath = join(__dirname, "..", "package.json");
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
}

/**
 * Parses command line arguments to extract config path and presets
 * @returns {Object} Object containing configPath and presets
 */
function parseCommandLineArgs(): CommandLineArgs {
  const args = process.argv.slice(2);
  let configPath: string | undefined;
  let presets: string[] = []; // Initialize with empty array
  let hasPreset = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--config" && i + 1 < args.length) {
      configPath = args[i + 1];
    } else if (args[i] === "--preset" && i + 1 < args.length) {
      // Split comma-separated presets
      presets = args[i + 1].split(",");
      hasPreset = true;
    }
  }

  // Only default to thinking preset if no preset specified AND no config path provided
  if (presets.length === 0 && !configPath) {
    presets = ["thinking"];
  }

  return { configPath, presets };
}

/**
 * Loads and merges configuration from presets and user config
 * @param presets - Array of preset names to load
 * @param configPath - Optional path to user config
 */
function loadAndMergeConfig(
  presets: string[],
  configPath?: string
): Record<string, any> {
  // Log available presets
  const availablePresets = listAvailablePresets();
  console.error(`Available presets: ${availablePresets.join(", ")}`);
  console.error(`Using presets: ${presets.join(", ")}`);

  // 1. Load preset configs
  const presetConfig = loadPresetConfigs(presets);
  console.error(
    `Loaded ${Object.keys(presetConfig).length} tools from presets`
  );

  // 2. Load user configs from .workflows directory if provided
  const userConfig = configPath ? loadConfigSync(configPath) : {};
  if (configPath) {
    console.error(
      `Loaded ${
        Object.keys(userConfig).length
      } tool configurations from user config directory: ${configPath}`
    );
  }

  // 3. Merge configs (user config overrides preset config)
  const finalConfig = mergeConfigs(presetConfig, userConfig);
  console.error(
    `Final configuration contains ${Object.keys(finalConfig).length} tools`
  );

  return finalConfig;
}

/**
 * Creates and configures the MCP server with tools from the provided configuration
 * @param config - The tool configuration object
 * @param version - Server version
 */
function createMcpServer(
  config: Record<string, any>,
  version: string
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
    }
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
      }
    );
  }

  return server;
}

/**
 * Registers tools to the MCP server based on the provided configuration
 * @param server - The MCP server instance
 * @param config - The tool configuration object
 */
function registerToolsFromConfig(
  server: McpServer,
  config: Record<string, any>
): void {
  // Function to add a tool if it's not disabled
  const addTool = (
    name: string,
    description: string,
    inputSchema: any | undefined,
    callback: (params?: Record<string, any>) => Promise<any>
  ) => {
    server.tool(
      name,
      description,
      inputSchema,
      async (params: Record<string, any>) => {
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
      }
    );
  };

  // Dynamically register all tools from the config
  Object.entries(config).forEach(([key, toolConfig]: [string, any]) => {
    // Skip if toolConfig is undefined or disabled
    if (!toolConfig || toolConfig.disabled) {
      return;
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
        JSON.stringify(Object.keys(inputSchema), null, 2)
      );
    }

    addTool(
      toolName,
      toolConfig.description || `${key.replace(/_/g, " ")} tool`,
      inputSchema,
      async (params?: Record<string, any>) => {
        // Generate the tool prompt
        let text = generateToolPrompt(key, toolConfig, promptFunction, config);

        // If we have parameters, add them to the response
        if (params && Object.keys(params).length > 0) {
          text += `\n\nParameters: ${JSON.stringify(params, null, 2)}`;
        }

        return { content: [{ type: "text", text }] };
      }
    );
  });
}

/**
 * Generates the prompt text for a tool based on its configuration
 * @param key - The tool key
 * @param toolConfig - The tool configuration
 * @param promptFunction - Optional prompt generation function
 * @param fullConfig - The complete configuration object
 */
function generateToolPrompt(
  key: string,
  toolConfig: Record<string, any>,
  promptFunction: ((config: Record<string, any>) => string) | undefined,
  fullConfig: Record<string, any>
): string {
  // Use the prompt function if available
  if (promptFunction) {
    return promptFunction(fullConfig);
  }

  // Otherwise use the prompt directly from config
  if (toolConfig.prompt) {
    let text = toolConfig.prompt;

    // Add context if provided
    if (toolConfig.context) {
      text += `\n\n${toolConfig.context}`;
    }

    // Add tools section if provided
    if (toolConfig.tools && toolConfig.tools.length > 0) {
      text += "\n\n## Available Tools\n";

      if (toolConfig.toolMode === "sequential") {
        text +=
          "If all required user input/feedback is acquired or if no input/feedback is needed, execute this exact sequence of tools to complete this task:\n\n";

        toolConfig.tools.forEach((tool: any, index: number) => {
          text += `${index + 1}. **${tool.name}**`;
          if (tool.description) {
            text += `: ${tool.description}`;
          }
          text += "\n";
        });
      } else {
        // Default to dynamic mode
        text += `Use these tools as needed to complete the user's request:\n\n`;

        toolConfig.tools.forEach((tool: any) => {
          text += `- **${tool.name}**`;
          if (tool.description) {
            text += `: ${tool.description}`;
          }
          text += "\n";
        });
      }
    }

    return text;
  }

  // No prompt available
  console.error(`Tool "${key}" has no prompt defined`);
  return `# ${key}\n\nNo prompt defined for this tool.`;
}

/**
 * Starts the MCP server with the specified transport
 * @param server - The configured MCP server
 * @param presets - Array of preset names used
 * @param configPath - Optional path to user config
 */
async function startServer(
  server: McpServer,
  presets: string[],
  configPath?: string
): Promise<void> {
  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
    console.error(
      `DevTools MCP server running with presets: ${presets.join(", ")}${
        configPath ? ` and user config from: ${configPath}` : ""
      }`
    );
  } catch (err) {
    console.error("Error starting server:", err);
  }
}

// Main execution
(async function main() {
  // Get package info
  const packageJson = getPackageInfo();

  // Parse command line arguments
  const { configPath, presets } = parseCommandLineArgs();

  // Load and merge configuration
  const finalConfig = loadAndMergeConfig(presets, configPath);

  // Create and configure the MCP server
  const server = createMcpServer(finalConfig, packageJson.version);

  // Start the server
  await startServer(server, presets, configPath);
})();
