import { promises as fsp } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "pathe";

import { defineCommand } from "citty";

import { createMcpServer, loadAndMergeConfig, startServer } from "@mcpn/core";

import { logger } from "../utils/logger";
import { cwdArgs, logLevelArgs } from "./_shared";

async function getPackageVersion(): Promise<string> {
	const __filename = fileURLToPath(import.meta.url);
	const packageJsonPath = join(dirname(__filename), "..", "..", "package.json");
	try {
		const pkgContent = await fsp.readFile(packageJsonPath, "utf8");
		const pkg = JSON.parse(pkgContent);
		return pkg.version || "unknown";
	} catch (error) {
		logger.error("Failed to read package.json:", error);
		return "unknown";
	}
}

export default defineCommand({
	meta: {
		name: "server",
		description: "Start the MCP server process",
	},
	args: {
		...cwdArgs,
		...logLevelArgs,
		force: {
			type: "boolean",
			description:
				"Override existing preset file or directory in .mcp-workflows",
		},
		preset: {
			type: "string",
			description:
				"Comma-separated list of presets to use (e.g., thinking,code). Defaults to 'thinking' if no preset or config is specified.",
		},
		config: {
			type: "string",
			description: "Path to a specific user configuration file or directory",
		},
		presetsDir: {
			type: "string",
			description: "Directory containing preset YAML files",
		},
	},
	async run(ctx) {
		logger.info("Starting MCP server...");

		const configPath = ctx.args.config;
		let presets: string[] = [];

		if (ctx.args.preset) {
			presets = ctx.args.preset
				.split(",")
				.map((p) => p.trim())
				.filter(Boolean);
		}

		if (presets.length === 0 && !configPath) {
			logger.info(
				"No preset or config specified, defaulting to 'thinking' preset.",
			);
			presets = ["thinking"];
		}

		try {
			const version = await getPackageVersion();
			if (version === "unknown") {
				logger.warn("Could not determine package version.");
			}

			// Determine CLI's own dist/presets directory
			const cliFile = fileURLToPath(import.meta.url);
			const cliDir = dirname(cliFile);
			const cliDistPresetsDir = join(cliDir, "../presets");

			// Use explicit --presets-dir if provided, else default to CLI's dist/presets
			const presetsDirArg = ctx.args.presetsDir as string | undefined;
			const presetsDir = presetsDirArg || cliDistPresetsDir;

			logger.info(
				`Loading configuration with presets: ${presets.join(", ")}${configPath ? ` and config: ${configPath}` : ""}`,
			);
			const finalConfig = loadAndMergeConfig(presets, configPath, presetsDir);

			const server = createMcpServer(finalConfig, version);

			await startServer(server, presets, configPath);
		} catch (error) {
			logger.error("Failed to start MCP server:", error);
			process.exit(1);
		}
	},
});
