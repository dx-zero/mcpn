/**
 * Command line parser using Commander.js
 */

import { Command } from "commander";
import inquirer from "inquirer";
import { initCommand } from "./commands/init.js";

// Create and configure the program
const program = new Command();

// Set program metadata
program
  .name("mcpn")
  .description("MCPN CLI - MCP workflow orchestration and registry tool")
  .version("0.1.0"); // Get this from package.json in production

// Define the init command
program
  .command("init")
  .description("Initialize a new project with MCPN workflow support")
  .option("--cursor", "Configure for Cursor IDE")
  .option("--windsurf", "Configure for Windsurf IDE")
  .option("--cline", "Configure for Cline IDE")
  .option("--rootcode", "Configure for Rootcode IDE")
  .option("--headless", "Configure in headless mode (no IDE integration)")
  .action(async (options) => {
    await initCommand(options);
  });

// Define the add command and its alias
program
  .command("add")
  .alias("i")
  .description("Add a workflow preset from a URL")
  .argument("<url>", "URL to the preset YAML file")
  .option("--force", "Overwrite existing files with the same name")
  .action(async (url, options) => {
    // Will be implemented in later phases
    console.log(`Add command called with URL: ${url}, options:`, options);
  });

// Define the remove command and its aliases
program
  .command("remove")
  .alias("rm")
  .alias("uninstall")
  .description("Remove a workflow or preset")
  .argument("<workflow-name>", "Name of the workflow to remove")
  .action(async (workflowName, options) => {
    // Will be implemented in later phases
    console.log(
      `Remove command called for: ${workflowName}, options:`,
      options
    );
  });

// Handle backward compatibility with --config and --preset flags
program
  .option(
    "--config <path>",
    "Path to configuration directory (backward compatible)"
  )
  .option(
    "--preset <presets>",
    "Comma-separated preset names to load (backward compatible)"
  );

/**
 * Parses the arguments and returns the command details
 * This function maintains backward compatibility with our existing interface
 */
export function parseArgs(args: string[]): ParsedArgs {
  // For backward compatibility with tests, we use a simpler approach
  // that mimics our original parseArgs function
  const result: ParsedArgs = {
    values: [],
    options: {},
  };

  // Command aliases mapping to keep consistent with original implementation
  const commandAliases: Record<string, string> = {
    i: "add",
    rm: "remove",
    uninstall: "remove",
  };

  // Parse arguments similar to our original function
  if (args.length > 0 && !args[0].startsWith("-")) {
    const potentialCommand = args[0];
    result.command = commandAliases[potentialCommand] || potentialCommand;
    args = args.slice(1);
  }

  // Process remaining arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const optionName = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        result.options[optionName] = args[i + 1];
        i++; // Skip the value
      } else {
        result.options[optionName] = true;
      }
    } else {
      result.values.push(arg);
    }
  }

  return result;
}

/**
 * Parse command line arguments directly using Commander
 * @param args Command line arguments
 * @returns The parsed command
 */
export function parseCommandLine(args: string[]): Command {
  program.parse(args);
  return program;
}

/**
 * Example function for interactive prompts with inquirer
 * This would be used in the init command implementation
 */
export async function promptForIde(): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "ide",
      message: "Which IDE would you like to configure for?",
      choices: [
        { name: "Cursor", value: "cursor" },
        { name: "Windsurf", value: "windsurf" },
        { name: "Cline", value: "cline" },
        { name: "Rootcode", value: "rootcode" },
        { name: "None (Headless mode)", value: "headless" },
      ],
    },
  ]);
  return answers.ide;
}

// Define the interface for backward compatibility
export interface ParsedArgs {
  command?: string;
  values: string[];
  options: Record<string, any>;
}

export default program;
