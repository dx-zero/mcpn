import * as fs from "fs";
import * as path from "path";
import { select } from "@inquirer/prompts";

/**
 * Generate IDE-specific configuration based on the selected IDE
 */
function generateIdeConfig(ide: string): string {
  return `  ide: '${ide.toLowerCase()}'`;
}

/**
 * Generate the config file content
 */
function generateConfigContent(options: Record<string, any>): string {
  let ide = "auto";

  // Determine IDE configuration
  if (options.cursor) {
    ide = "cursor";
  } else if (options.windsurf) {
    ide = "windsurf";
  } else if (options.cline) {
    ide = "cline";
  } else if (options.rootcode) {
    ide = "rootcode";
  }

  // Add headless mode configuration if specified
  const headlessConfig = options.headless
    ? `\n  headless: true,
  workflowsDir: '${path.join(
    process.env.HOME || process.env.USERPROFILE || "",
    "Documents",
    "mcpn",
    ".mcp-workflows"
  )}'`
    : "";

  return `module.exports = {
  ide: '${ide}'${headlessConfig}
};
`;
}

/**
 * Set up the headless mode directory structure
 */
async function setupHeadlessMode(
  fs: typeof import("fs"),
  path: typeof import("path"),
  console: Console
): Promise<void> {
  // Create headless mode directories in user's Documents folder
  const documentsDir = path.join(
    process.env.HOME || process.env.USERPROFILE || "",
    "Documents"
  );
  const mcpnDir = path.join(documentsDir, "mcpn");
  const workflowsDir = path.join(mcpnDir, ".mcp-workflows");

  // Create mcpn directory if it doesn't exist
  if (!fs.existsSync(mcpnDir)) {
    fs.mkdirSync(mcpnDir, { recursive: true });
    console.log(`Created MCPN directory at: ${mcpnDir}`);
  }

  // Create .mcp-workflows directory inside mcpn directory if it doesn't exist
  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
    console.log(`Created workflows directory at: ${workflowsDir}`);
  }
}

/**
 * Prompt the user to select an IDE
 */
export async function promptForIde(): Promise<string> {
  const answer = await select({
    message: "Select your IDE:",
    choices: [
      { value: "cursor", name: "Cursor" },
      { value: "windsurf", name: "Windsurf" },
      { value: "cline", name: "Cline" },
      { value: "rootcode", name: "Rootcode" },
      { value: "auto", name: "Auto-detect" },
    ],
  });

  return answer;
}

/**
 * Initialize MCPN in the current directory
 */
export async function initCommand(
  options: Record<string, any> = {},
  dependencies = { fs, path, console, promptForIde }
): Promise<void> {
  const {
    fs: fsModule,
    path: pathModule,
    console: consoleModule,
    promptForIde: promptFn,
  } = dependencies;

  try {
    // Create .mcp-workflows directory if it doesn't exist
    const workflowsPath = pathModule.join(process.cwd(), ".mcp-workflows");
    if (!fsModule.existsSync(workflowsPath)) {
      fsModule.mkdirSync(workflowsPath, { recursive: true });
      consoleModule.log(
        `Created .mcp-workflows directory at: ${workflowsPath}`
      );
    } else {
      consoleModule.log(
        `.mcp-workflows directory already exists at: ${workflowsPath}`
      );
    }

    // Set up headless mode if specified
    if (options.headless) {
      await setupHeadlessMode(fsModule, pathModule, consoleModule);
    }

    // Determine IDE configuration
    let userOptions = { ...options };

    // Prompt for IDE selection if no IDE flag is specified
    if (
      !options.cursor &&
      !options.windsurf &&
      !options.cline &&
      !options.rootcode
    ) {
      const selectedIde = await promptFn();
      userOptions[selectedIde] = true;
    }

    // Generate config file content
    const configContent = generateConfigContent(userOptions);

    // Create mcp-config.js file inside .mcp-workflows if it doesn't exist
    const configPath = pathModule.join(workflowsPath, "mcp-config.js");
    if (!fsModule.existsSync(configPath)) {
      fsModule.writeFileSync(configPath, configContent, "utf-8");
      consoleModule.log(`Created mcp-config.js at: ${configPath}`);
    } else {
      consoleModule.log(`mcp-config.js already exists at: ${configPath}`);
    }

    consoleModule.log(
      'MCPN initialization complete! Run "npx mcpn" to start the server.'
    );
  } catch (error: any) {
    consoleModule.error(`Error initializing MCPN: ${error.message}`);
  }
}
