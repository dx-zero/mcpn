/**
 * Main CLI entry point and command router
 */

import program, { parseArgs } from "./command-parser.js";
import { generateHelp, generateCommandHelp } from "./help-display.js";
import { startServer } from "../server.js";
import {
  loadConfigSync,
  loadPresetConfigs,
  mergeConfigs,
  listAvailablePresets,
} from "../config.js";
import { getPackageInfo } from "../utils.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerToolsFromConfig } from "../server.js";

export interface CliResult {
  mode: "server" | "command" | "help";
  command?: string;
  args?: string[];
  options?: Record<string, any>;
  presets?: string[];
  configPath?: string;
}

/**
 * Start the MCP server with the specified configuration
 * @param configPath - Optional path to configuration
 * @param presets - Array of preset names to load
 */
export async function startServerWithConfig(
  configPath?: string,
  presets: string[] = []
): Promise<void> {
  // Log available presets
  const availablePresets = listAvailablePresets();
  console.error(`Available presets: ${availablePresets.join(", ")}`);
  console.error(`Using presets: ${presets.join(", ")}`);

  // 1. Load preset configs
  const presetConfig = loadPresetConfigs(presets);
  console.error(
    `Loaded ${Object.keys(presetConfig).length} tools from presets`
  );

  // 2. Load user configs from the specified directory if provided
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

  // 4. Create and start the server with the merged configurations
  const packageJson = getPackageInfo();

  // Create the MCP server
  const server = createMcpServer(finalConfig, packageJson.version);

  // Start the server
  await startServer(server, presets, configPath);
}

/**
 * Creates and configures the MCP server with tools from the provided configuration
 * This function creates a basic MCP server and registers tools
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

  // Register tools from config if registerToolsFromConfig is exported from server.js
  try {
    registerToolsFromConfig(server, config);
  } catch (error) {
    // If registerToolsFromConfig is not exported, we'll use a placeholder tool
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
 * Process CLI arguments using Commander
 * @param args Command line arguments
 * @param mockMode Set to true to return the planned action without executing it (for testing)
 * @returns Result object with mode and relevant data
 */
export async function runCli(
  args: string[],
  mockMode = false
): Promise<CliResult> {
  // For backward compatibility with tests, we'll use our parseArgs function
  const parsed = parseArgs(args);

  // Handle help flag
  if (parsed.options.help) {
    if (parsed.command) {
      // Command-specific help
      if (!mockMode) {
        console.log(generateCommandHelp(parsed.command));
      }
      return {
        mode: "help",
        command: parsed.command,
      };
    } else {
      // General help
      if (!mockMode) {
        console.log(generateHelp());
      }
      return { mode: "help" };
    }
  }

  // If we have a command, process it
  if (parsed.command) {
    // In mock mode, just return the planned action
    if (mockMode) {
      return {
        mode: "command",
        command: parsed.command,
        args: parsed.values,
        options: parsed.options,
      };
    }

    // Not in mock mode, let Commander handle execution
    if (!mockMode) {
      program.parse(args, { from: "user" });
    }

    return {
      mode: "command",
      command: parsed.command,
      args: parsed.values,
      options: parsed.options,
    };
  } else {
    // No command, run in server mode (backward compatibility)
    const presets = parsed.options.preset
      ? parsed.options.preset.split(",")
      : parsed.options.config
      ? []
      : ["thinking"];

    if (mockMode) {
      return {
        mode: "server",
        presets: presets,
        configPath: parsed.options.config,
      };
    }

    // Start the server with the parsed configuration
    if (!mockMode) {
      await startServerWithConfig(parsed.options.config, presets);
    }

    return {
      mode: "server",
      presets: presets,
      configPath: parsed.options.config,
    };
  }
}

/**
 * Main CLI entry point function
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // In real execution, directly use Commander for a better experience
  const parsed = parseArgs(args);

  // If we have a command, let Commander handle it
  if (parsed.command) {
    program.parse(process.argv);
  } else {
    // Otherwise, run in server mode (backward compatibility)
    await runCli(args);
  }
}
