/**
 * Shared utility functions for MCP server
 */

import fs from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { TemplateParams } from "./@types/common";
import type { PackageInfo } from "./@types/common";
import type { PromptTools, ToolConfig } from "./@types/config";
import type { ToolItem } from "./@types/prompts";

/**
 * Interface for a tool in the tools list
 */

/**
 * Finds the project root directory by searching upwards from the current module's location
 * for a directory containing 'package.json'.
 * @returns {string} The absolute path to the project root.
 * @throws {Error} If package.json cannot be found.
 */
function findProjectRoot(): string {
	let currentDir = dirname(fileURLToPath(import.meta.url));
	while (true) {
		const packageJsonPath = join(currentDir, "package.json");
		if (fs.existsSync(packageJsonPath)) {
			// Check if it's the monorepo root or the package root
			// A simple check: does it have a 'packages' directory or is the name '@mcpn/core'?
			// You might need a more robust check depending on your monorepo structure
			const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
			if (pkg.name === "@mcpn/core") {
				return currentDir;
			}
		}
		const parentDir = resolve(currentDir, "..");
		if (parentDir === currentDir) {
			// Reached the filesystem root
			throw new Error(
				"Could not find project root containing package.json for '@mcpn/core'.",
			);
		}
		currentDir = parentDir;
	}
}

// Store the project root path
const PROJECT_ROOT = findProjectRoot();

// Define paths relative to the project root
const SOURCE_PRESETS_DIR = join(PROJECT_ROOT, "src", "presets");
const BUILT_PRESETS_DIR = join(PROJECT_ROOT, "dist", "presets");

// Export the constants
export { PROJECT_ROOT, SOURCE_PRESETS_DIR, BUILT_PRESETS_DIR };

/**
 * Gets the package version from package.json located at the project root.
 * @returns {Object} The parsed package.json content.
 */
export function getPackageInfo(): PackageInfo {
	const packageJsonPath = join(PROJECT_ROOT, "package.json");
	try {
		return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(
			`Error reading package.json at ${packageJsonPath}: ${errorMessage}`,
		);
		// Provide a default or re-throw, depending on desired behavior
		throw new Error(`Failed to get package info: ${errorMessage}`);
	}
}

/**
 * Formats tools into a consistent list structure regardless of input format
 *
 * @param tools - Tools configuration in either string or object format
 * @returns Array of formatted tool items
 */
export function formatToolsList(tools: PromptTools | undefined): ToolItem[] {
	if (tools === undefined || tools === null) {
		return [];
	}

	let toolsList: ToolItem[] = [];

	// Handle different formats for tools
	if (typeof tools === "string") {
		// Handle comma-separated string format: "tool1, tool2, tool3"
		// Handle empty string as a special case
		if (tools.trim() === "") {
			return [{ name: "", description: "" }];
		}

		toolsList = tools.split(",").map((t: string) => ({
			name: t.trim(),
			description: "",
		}));
	} else if (typeof tools === "object") {
		// Handle object notation format
		toolsList = Object.entries(tools).map(([name, value]) => {
			if (typeof value === "string") {
				// Flat format: toolName: "description"
				return { name, description: value };
			}
			if (typeof value === "object" && value !== null) {
				// Full format: toolName: { description: "desc", prompt: "prompt", optional: true }
				return {
					name,
					description: (value as ToolConfig).description || "",
					prompt: (value as ToolConfig).prompt || "",
					optional: (value as ToolConfig).optional || false,
				};
			}
			return { name, description: "" };
		});
	}

	return toolsList;
}

/**
 * Appends formatted tools to a prompt text
 *
 * @param baseText - The base prompt text to append tools to
 * @param toolsList - List of tools to format
 * @param toolMode - Mode for tool usage (sequential or situational/dynamic)
 * @returns The prompt text with appended tools section
 */
export function appendFormattedTools(
	baseText: string,
	toolsList: ToolItem[],
	toolMode?: "sequential" | "situational",
): string {
	if (toolsList.length === 0) {
		return baseText;
	}

	let resultText = `${baseText}\n\n## Available Tools\n`;

	if (toolMode === "sequential") {
		resultText +=
			"If all required user input/feedback is acquired or if no input/feedback is needed, execute this exact sequence of tools to complete this task:\n\n";

		for (const [index, tool] of toolsList.entries()) {
			resultText += `${index + 1}. ${tool.name}`;
			if (
				(!tool.prompt && tool.description) ||
				(tool.prompt && tool.description)
			) {
				resultText += ": ";
			}
			if (tool.description) {
				resultText += `${tool.description}`;
			}
			if (tool.prompt && tool.description) {
				resultText += " - ";
			}
			if (tool.prompt && !tool.description) {
				resultText += ": ";
			}
			if (tool.prompt) {
				resultText += `${tool.prompt}`;
			}
			if (tool.optional) {
				resultText += " (Optional)";
			}
			resultText += "\n";
		}
	} else {
		// Default to dynamic mode
		resultText += `Use these tools as needed to complete the user's request:\n\n`;

		for (const tool of toolsList) {
			resultText += `- ${tool.name}`;
			if (
				(!tool.prompt && tool.description) ||
				(tool.prompt && tool.description)
			) {
				resultText += ": ";
			}
			if (tool.description) {
				resultText += `${tool.description}`;
			}
			if (tool.prompt && tool.description) {
				resultText += " - ";
			}
			if (tool.prompt && !tool.description) {
				resultText += ": ";
			}
			if (tool.prompt) {
				resultText += `${tool.prompt}`;
			}
			if (tool.optional) {
				resultText += " (Optional)";
			}
			resultText += "\n";
		}
	}

	resultText +=
		"\nAfter using each tool, return a 'Next Steps' section with a list of the next steps to take / remaining tools to invoke along with each tool's prompt/description and 'optional' flag if present.";

	return resultText;
}

/**
 * Processes a template string by replacing {{ paramName }} placeholders with actual parameter values
 *
 * @param template - The template string containing placeholders
 * @param params - Object containing parameter values
 * @returns Object with the processed string and a set of parameters that were used
 */
export function processTemplate(
	template: string,
	params: TemplateParams,
): { result: string; usedParams: Set<string> } {
	const usedParams = new Set<string>();

	// Handle undefined or null template
	if (template === undefined || template === null) {
		return { result: "", usedParams };
	}

	// Skip processing if no params provided
	if (!params || Object.keys(params).length === 0) {
		return { result: template, usedParams };
	}

	// Replace {{ paramName }} with actual values
	const result = template.replace(
		/\{\{\s*([^}]+)\s*\}\}/g,
		(match, paramName) => {
			const trimmedName = paramName.trim();
			if (trimmedName in params) {
				usedParams.add(trimmedName);
				return String(params[trimmedName]);
			}
			return match; // Keep original placeholder if parameter not found
		},
	);

	return { result, usedParams };
}
