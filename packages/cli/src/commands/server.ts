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

			// If the caller supplied --presets-dir we use it; otherwise we let the
			// core package resolve its own presets directory. This prevents the
			// CLI’s (mostly empty) dist/presets folder from shadowing the real
			// presets and fixes the missing‑preset errors in the test‑suite.
			const presetsDir = ctx.args.presetsDir as string | undefined;

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