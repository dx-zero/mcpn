import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";
import type { DevToolsConfig } from "./@types/config";
import { mergeConfigs } from "./config";

// Resolve the directory path dynamically for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads preset configuration from a YAML file
 *
 * @param {string} filePath - Path to the preset YAML file
 * @returns {DevToolsConfig} The loaded configuration or empty object on error
 */
function loadPresetConfig(filePath: string): DevToolsConfig {
	try {
		const content = fs.readFileSync(filePath, "utf-8");
		const config = yaml.load(content) as DevToolsConfig;

		if (typeof config !== "object") {
			console.error(
				`Preset config in ${filePath} must be an object, returning empty config`,
			);
			return {};
		}

		return config;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(
			`Error loading preset config from ${filePath}: ${errorMessage}`,
		);
		return {};
	}
}

/**
 * Lists all available preset names by scanning the presets directory
 *
 * @returns {string[]} Array of available preset names (without file extensions)
 */
export function listAvailablePresets(): string[] {
	try {
		const presetsDir = path.join(__dirname, "presets");
		if (!fs.existsSync(presetsDir)) {
			console.error(`Presets directory not found at ${presetsDir}`);
			return [];
		}

		return fs
			.readdirSync(presetsDir)
			.filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
			.map((file) => path.basename(file, path.extname(file)));
	} catch (error) {
		console.error("Error listing available presets:", error);
		return [];
	}
}

/**
 * Loads configuration from preset names
 *
 * @param {string[]} presets - Array of preset names to load
 * @returns {DevToolsConfig} The merged preset configuration
 */
export function loadPresetConfigs(
	presetNames: string[],
	presetsDirOverride?: string,
): Record<string, any> {
	const presetsDir = resolvePresetsDir(presetsDirOverride);

	const configs: Record<string, any> = {};

	for (const presetName of presetNames) {
		const presetFile = path.join(presetsDir, `${presetName}.yaml`);
		if (!fs.existsSync(presetFile)) {
			console.warn(
				`Preset "${presetName}" not found at ${presetFile}, skipping`,
			);
			continue;
		}
		try {
			const content = fs.readFileSync(presetFile, "utf-8");
			const yamlConfig = yaml.load(content) as Record<string, any>;
			console.error("Loaded preset YAML keys:", Object.keys(yamlConfig));
			Object.assign(configs, yamlConfig);
		} catch (err) {
			console.error(`Error loading preset "${presetName}":`, err);
		}
	}

	return configs;
}

function resolvePresetsDir(presetsDirOverride?: string) {
	const coreDistPresetsDir = path.join(__dirname, "presets");
	if (presetsDirOverride && fs.existsSync(presetsDirOverride)) {
		return presetsDirOverride;
	}
	return coreDistPresetsDir;
}

export function loadAvailablePresets(presetsDirOverride?: string) {
	const coreDistPresetsDir = path.join(__dirname, "presets");

	const presetsDir =
		presetsDirOverride && fs.existsSync(presetsDirOverride)
			? presetsDirOverride
			: coreDistPresetsDir;

	if (!fs.existsSync(presetsDir)) {
		console.warn(`Presets directory not found at ${presetsDir}`);
		return [];
	}

	return fs
		.readdirSync(presetsDir)
		.filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
		.map((file) => path.basename(file, path.extname(file)));
}

/**
 * Retrieves the raw content of a specific preset file.
 *
 * @param {string} presetName - The name of the preset to load (without extension).
 * @param {string} [presetsDirOverride] - Optional override path for the presets directory.
 * @returns {string} The raw content of the preset file.
 * @throws {Error} If the preset file is not found or cannot be read.
 */
export function getPresetRawContent(
	presetName: string,
	presetsDirOverride?: string,
): string {
	const presetsDir = resolvePresetsDir(presetsDirOverride);
	const presetFile = path.join(presetsDir, `${presetName}.yaml`);

	if (!fs.existsSync(presetFile)) {
		const ymlPresetFile = path.join(presetsDir, `${presetName}.yml`);
		if (fs.existsSync(ymlPresetFile)) {
			// Try .yml if .yaml doesn't exist
			try {
				return fs.readFileSync(ymlPresetFile, "utf-8");
			} catch (error: unknown) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				throw new Error(
					`Error reading preset file ${ymlPresetFile}: ${errorMessage}`,
				);
			}
		}
		throw new Error(`Preset "${presetName}" not found at ${presetFile} or ${ymlPresetFile}`);
	}

	try {
		return fs.readFileSync(presetFile, "utf-8");
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`Error reading preset file ${presetFile}: ${errorMessage}`);
	}
}
