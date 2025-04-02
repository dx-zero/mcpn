import { existsSync, promises as fsp } from "node:fs";
import { tmpdir } from "node:os";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "pathe";

import { defineCommand } from "citty";
import { colors } from "consola/utils";
import { downloadTemplate } from "giget";

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

			logger.info(
				`Loading configuration with presets: ${presets.join(", ")}${configPath ? ` and config: ${configPath}` : ""}`,
			);
			const finalConfig = loadAndMergeConfig(presets, configPath);

			const server = createMcpServer(finalConfig, version);

			await startServer(server, presets, configPath);
		} catch (error) {
			logger.error("Failed to start MCP server:", error);
			process.exit(1);
		}
	},
});
