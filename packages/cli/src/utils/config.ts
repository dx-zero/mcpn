import process from "node:process";
import { type LoadConfigOptions, loadConfig as loadC12Config } from "c12";
import { createJiti } from "jiti";
import { resolve } from "pathe";
import { logger } from "./logger";

// Define the structure of your configuration object
export interface McpnConfig {
	ide?: string;
	// Add other configuration options here
	[key: string]: unknown; // Allow other keys potentially
}

// Define the structure of the resolved configuration manually
// based on what c12 actually returns plus our additions
export interface ResolvedMcpnConfig {
	config?: McpnConfig | null; // Config object (or null/undefined if not found)
	configFile?: string; // Path to the loaded config file
	layers?: any[]; // Layers used by c12 (if any)
	cwd: string; // The resolved working directory
}

const defaults: LoadConfigOptions<McpnConfig> = {
	name: "mcpn", // Name of the config file (mcpn.config.ts, mcpn.config.js, etc.)
	configFile: "mcpn.config", // Base name without extension
	rcFile: false, // Disable .mcpnrc lookup
	globalRc: false, // Disable global rc lookup
	packageJson: false, // Disable package.json lookup
	dotenv: true, // Load .env files
	jiti: createJiti(process.cwd(), {
		interopDefault: true,
	}),
};

export async function loadMcpnConfig(
	cwd: string = process.cwd(),
): Promise<ResolvedMcpnConfig> {
	const resolvedCwd = resolve(cwd);
	logger.debug(`Loading MCPN config from: ${resolvedCwd}`);

	const loadedC12Result = await loadC12Config<McpnConfig>({
		...defaults,
		cwd: resolvedCwd,
	});

	// Construct the ResolvedMcpnConfig object from c12's result
	const resolvedConfig: ResolvedMcpnConfig = {
		config: loadedC12Result.config,
		configFile: loadedC12Result.configFile,
		layers: loadedC12Result.layers,
		cwd: resolvedCwd,
	};

	if (!resolvedConfig.config && !resolvedConfig.configFile) {
		logger.debug("No mcpn.config file found during load attempt.");
		// Return the structure indicating no file was found
		return resolvedConfig; // Already contains cwd and undefined config/configFile
	}

	logger.debug(
		`Loaded config from: ${resolvedConfig.configFile || "unknown source"}`,
	);
	logger.debug("Config content:", resolvedConfig.config);

	return resolvedConfig;
}

// Helper to check if a config file was actually loaded
export function configFileExists(config: ResolvedMcpnConfig): boolean {
	return !!config.configFile;
}

// Gets config or throws if not found
export async function loadMcpnConfigOrFail(
	cwd?: string,
): Promise<ResolvedMcpnConfig> {
	const config = await loadMcpnConfig(cwd);
	if (!configFileExists(config)) {
		// Maybe provide a more helpful error message, suggesting `mcpn init`
		throw new Error(
			`MCPN configuration file (e.g., mcpn.config.ts) not found in ${config.cwd}. Please run 'mcpn init' or create one manually.`,
		);
	}
	return config;
}
