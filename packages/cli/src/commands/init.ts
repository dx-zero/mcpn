import { existsSync, mkdirSync } from "node:fs";
import { promises as fsp } from "node:fs";
import process from "node:process";

import { defineCommand } from "citty";
import { colors } from "consola/utils";
import { relative, resolve } from "pathe";

import type { McpnConfig } from "../@types/config";
import { detectIDE } from "../utils/detectIde";
//4import { dxLogo, themeColor } from '../utils/ascii'
import { logger } from "../utils/logger";
import { cwdArgs, logLevelArgs } from "./_shared";

// Define a basic structure for the config file

// Updated function to create the config file
async function createConfigFile(
	projectPath: string,
	config: Partial<McpnConfig>,
) {
	// Use .mjs extension for ES Modules
	const configFilePath = resolve(projectPath, "mcpn.config.mjs");

	// Check if config file already exists
	if (existsSync(configFilePath)) {
		const overwrite = await logger
			.prompt(
				`Configuration file ${colors.cyan(relative(process.cwd(), configFilePath))} already exists. Overwrite?`,
				{
					type: "confirm",
					initial: false,
					cancel: "reject",
				},
			)
			.catch(() => process.exit(1));

		if (!overwrite) {
			logger.info("Skipped configuration file creation.");
			return; // Exit the function without writing the file
		}
		logger.info("Overwriting existing configuration file.");
	}

	// Generate cleaner ES Module content
	const configContent = `// MCPN Configuration File
// Add your configuration options here

export default ${JSON.stringify(config, null, 2)};
`;

	await fsp.writeFile(configFilePath, configContent);
	logger.success(
		`Created configuration file: ${colors.cyan(relative(process.cwd(), configFilePath))}`,
	);
}

export default defineCommand({
	meta: {
		name: "init",
		description: "Initialize MCPN in the current project",
	},
	args: {
		...cwdArgs,
		...logLevelArgs,
		dir: {
			type: "positional",
			description: "Directory to initialize in (defaults to current directory)",
			default: ".",
		},
		// Replace boolean flags with a single string flag for IDE selection
		ide: {
			type: "string",
			description:
				"Specify IDE integration (options: cursor, windsurf, cline, rootcode, headless). Defaults to auto-detection.",
		},
	},
	async run(ctx) {
		const cwd = resolve(ctx.args.cwd);
		const projectPath = resolve(cwd, ctx.args.dir);
		const relativeProjectPath = relative(process.cwd(), projectPath) || ".";

		logger.info(`Initializing MCPN in ${colors.cyan(relativeProjectPath)}...`);

		try {
			if (!existsSync(projectPath)) {
				mkdirSync(projectPath, { recursive: true });
				logger.success(
					`Created directory: ${colors.cyan(relativeProjectPath)}`,
				);
			}

			const workflowsPath = resolve(projectPath, ".mcp-workflows");
			if (existsSync(workflowsPath)) {
				logger.info(
					`Workflow directory already exists: ${colors.cyan(relative(process.cwd(), workflowsPath))}`,
				);
			} else {
				mkdirSync(workflowsPath, { recursive: true });
				logger.success(
					`Created workflow directory: ${colors.cyan(relative(process.cwd(), workflowsPath))}`,
				);
			}

			// Determine IDE based on the --ide flag or detection
			let selectedIde: string | undefined | null = undefined; // Use null to signify headless explicitly chosen
			const validIdeOptions = [
				"cursor",
				"windsurf",
				"cline",
				"rootcode",
				"headless",
			];

			if (ctx.args.ide) {
				const ideArg = ctx.args.ide.toLowerCase();
				if (validIdeOptions.includes(ideArg)) {
					if (ideArg === "headless") {
						selectedIde = null; // Headless mode requested
						logger.info(
							"Configuring in headless mode (no IDE specific settings).",
						);
					} else {
						selectedIde = ideArg;
						logger.info(`Configuring for specified IDE: ${selectedIde}`);
					}
				} else {
					logger.warn(
						`Invalid value "${ctx.args.ide}" for --ide flag. Valid options are: ${validIdeOptions.join(", ")}. Falling back to auto-detection.`,
					);
				}
			}

			// If no valid flag was provided, attempt detection
			if (selectedIde === undefined) {
				selectedIde = detectIDE();
				if (selectedIde) {
					logger.info(`Detected IDE: ${selectedIde}`);
				} else {
					logger.info(
						"Could not automatically detect IDE. No specific IDE configured.",
					);
				}
			}

			const config: Partial<McpnConfig> = {};
			// Only add 'ide' to config if it's not headless mode
			if (selectedIde !== null && selectedIde !== undefined) {
				config.ide = selectedIde;
			}

			// Create the config file with determined settings
			await createConfigFile(projectPath, config);
		} catch (error_) {
			logger.error(`Failed to initialize MCPN: ${(error_ as Error).message}`);
			process.exit(1);
		}

		logger.log(
			`\n✨ MCPN initialized successfully in ${colors.cyan(relativeProjectPath)}`,
		);
		logger.log(
			`  ${existsSync(resolve(projectPath, ".mcp-workflows")) ? "Ensured" : "Created"} ${colors.cyan(".mcp-workflows")} directory.`,
		);
		logger.log(
			`  ${existsSync(resolve(projectPath, "mcpn.config.mjs")) ? "Updated/Ensured" : "Created"} ${colors.cyan("mcpn.config.mjs")} configuration file.`,
		);
		logger.log("\nNext steps:");
		const steps = [
			relativeProjectPath !== "." &&
				`Make sure you are in the '${relativeProjectPath}' directory.`,
			"Define your workflows in the `.mcp-workflows` directory.",
			"Run commands using `mcpn run <workflow>`.",
		].filter(Boolean);

		for (const step of steps) {
			logger.log(` › ${step}`);
		}
	},
});
