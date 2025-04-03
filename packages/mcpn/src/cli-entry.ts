import mri from "mri";
import { resolve } from "pathe";
import type { CommandLineArgs } from "./@types/common";
import { createMcpServer, loadAndMergeConfig, startServer } from "./server.js"; // Assuming server functions are exported here
import { getPackageInfo } from "./utils.js"; // Assuming getPackageInfo is exported here

// --- Argument Parsing (Minimal version for direct execution) ---
export function parseCliEntryArgs(
	argv = process.argv.slice(2),
): CommandLineArgs {
	// Parse command-line flags via mri
	const { preset, config } = mri(argv, {
		alias: {
			c: "config",
		},
		// Force config and preset to parse as strings
		string: ["config", "preset"],
	});

	let configPath: string | undefined;
	let presets: string[] = [];

	if (config) {
		// Resolve the config path relative to cwd
		configPath = resolve(config.replace(/^['"]+|['"]+$/g, ""));
	}

	if (preset) {
		// Allow comma-separated presets
		presets = preset
			.split(",")
			.map((p: string) => p.trim())
			.filter(Boolean);
	} else if (!configPath) {
		// Only default to "thinking" if no config path and no preset
		console.error(
			"No preset or config specified, defaulting to 'thinking' preset.",
		);
		presets = ["thinking"];
	}

	return {
		configPath,
		presets,
	};
}

// --- Main Execution --- //
export async function main(argv = process.argv.slice(2)) {
	// Get package info
	const packageJson = getPackageInfo();

	// Parse command line arguments using the local parser
	const { configPath, presets } = parseCliEntryArgs(argv);

	// Load and merge configuration using SDK function
	const finalConfig = loadAndMergeConfig(presets, configPath);

	// Create and configure the MCP server using SDK function
	const server = createMcpServer(finalConfig, packageJson.version as string);

	// Start the server using SDK function
	await startServer(server, presets, configPath);

	return server;
}

// Only run the main function when this file is executed directly
// Use require.main for CJS compatibility check, fallback to import.meta.url for ESM
const isMainEntry =
	import.meta.main ||
	import.meta.url === new URL(process.argv[1], `file://${process.cwd()}/`).href;

if (isMainEntry) {
	main().catch((err) => {
		console.error("Error starting MCP server:", err);
		process.exit(1);
	});
}
