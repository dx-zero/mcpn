import * as fs from "node:fs";
import * as path from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";
import { z } from "zod";

// In ES modules, __dirname is not available directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Represents a parameter for a tool
 *
 * @interface ParameterConfig
 */
export interface ParameterConfig {
	/** Type of the parameter */
	type: "string" | "number" | "boolean" | "array" | "object" | "enum";
	/** Description of what the parameter does */
	description?: string;
	/** Whether the parameter is required */
	required?: boolean;
	/** Default value for the parameter */
	default?: any;
	/** Possible values for enum type parameters */
	enum?: (string | number)[];
	/** For array types, defines the type of items in the array */
	items?: ParameterConfig;
	/** For object types, defines the properties of the object */
	properties?: Record<string, ParameterConfig>;
}

/**
 * Represents a tool that can be used in a prompt
 *
 * @interface ToolConfig
 */
export interface ToolConfig {
	/** Name of the tool */
	name: string;
	/** Description of what the tool does */
	description?: string;
	/** Specific prompt text for this tool */
	prompt?: string;
	/** Whether this tool is optional to use */
	optional?: boolean;
	/** Parameters that the tool accepts */
	parameters?: Record<string, ParameterConfig>;
}

/**
 * Configuration for a specific prompt
 *
 * @interface PromptConfig
 */
export interface PromptConfig {
	/** If provided, completely replaces the default prompt */
	prompt?: string;
	/** Additional context to append to the prompt (either default or custom) */
	context?: string;
	/**
	 * Available tools for this prompt. Can be:
	 * - A Record of tool names to either description strings or ToolConfig objects
	 * - A comma-separated string of tool names
	 */
	tools?: Record<string, string | ToolConfig> | string;
	/** Whether tools should be executed sequentially or situationally */
	toolMode?: "sequential" | "situational";
	/** Description for the tool (used as second parameter in server.tool) */
	description?: string;
	/** Whether this tool is disabled */
	disabled?: boolean;
	/** Optional name override for the registered tool (default is the config key) */
	name?: string;
	/** Parameters that the tool accepts */
	parameters?: Record<string, ParameterConfig>;
}

/**
 * Main configuration interface for all developer tools
 * All tool configurations are dynamically loaded from YAML files in the presets directory
 *
 * @interface DevToolsConfig
 */
export interface DevToolsConfig {
	/**
	 * Dynamic mapping of tool names to their configurations
	 * Tool names are determined by the keys in the YAML preset files
	 */
	[key: string]: PromptConfig | undefined;
}

// Default empty configuration
const defaultConfig: DevToolsConfig = {};

/**
 * Merges two config objects, with the second one having precedence
 *
 * @param {DevToolsConfig} target - The target config to merge into
 * @param {DevToolsConfig} source - The source config to merge from (has precedence over target)
 * @returns {DevToolsConfig} The merged configuration object
 */
export function mergeConfigs(
	target: DevToolsConfig,
	source: DevToolsConfig,
): DevToolsConfig {
	for (const [key, value] of Object.entries(source)) {
		if (target[key]) {
			// If the property already exists, merge with the existing one
			target[key] = {
				...target[key],
				...value,
				// Special handling for tools array - concatenate rather than replace
				tools: mergeTools(target[key]?.tools, value?.tools),
			};
		} else {
			// Otherwise, just set it
			target[key] = value;
		}
	}

	return target;
}

/**
 * Helper function to merge tools from two configs
 *
 * @param {any} targetTools - The target tools
 * @param {any} sourceTools - The source tools to merge
 * @returns {any} The merged tools or undefined if both inputs are undefined
 */
function mergeTools(targetTools?: any, sourceTools?: any): any {
	if (!targetTools && !sourceTools) {
		return undefined;
	}
	if (!targetTools) {
		return sourceTools;
	}
	if (!sourceTools) {
		return targetTools;
	}

	// Handle string format
	if (typeof targetTools === "string" && typeof sourceTools === "string") {
		// Merge comma-separated strings
		const toolsSet = new Set([
			...targetTools.split(",").map((t) => t.trim()),
			...sourceTools.split(",").map((t) => t.trim()),
		]);
		return [...toolsSet].join(", ");
	}

	// Convert string to object format if needed
	const targetObj =
		typeof targetTools === "string"
			? Object.fromEntries(targetTools.split(",").map((t) => [t.trim(), ""]))
			: targetTools;

	const sourceObj =
		typeof sourceTools === "string"
			? Object.fromEntries(sourceTools.split(",").map((t) => [t.trim(), ""]))
			: sourceTools;

	// Merge objects with deep merge for tool properties
	const result = { ...targetObj };

	for (const [key, value] of Object.entries(sourceObj)) {
		if (
			key in result &&
			typeof result[key] === "object" &&
			typeof value === "object"
		) {
			// Deep merge for object values (preserving properties like prompt and optional)
			result[key] = { ...result[key], ...value };
		} else {
			// Replace or add the source value
			result[key] = value;
		}
	}

	return result;
}

/**
 * Loads configuration from all YAML files in the specified directory
 * or returns default config if directory not found or empty
 *
 * @param {string} [directoryPath] - Path to the directory containing configuration YAML files
 * @returns {Promise<DevToolsConfig>} Promise resolving to the loaded and merged configuration
 */
export async function loadConfig(
	directoryPath?: string,
): Promise<DevToolsConfig> {
	if (!directoryPath) {
		console.error(
			"No config directory path provided, using default configuration",
		);
		return defaultConfig;
	}

	try {
		// Resolve absolute path
		const absolutePath = path.resolve(directoryPath);

		// Check if directory exists and is a directory
		if (
			!fs.existsSync(absolutePath) ||
			!fs.statSync(absolutePath).isDirectory()
		) {
			console.error(
				`Config directory not found or is not a directory at ${absolutePath}, using default configuration`,
			);
			return defaultConfig;
		}

		// Check if directory name is either .workflows or .mcp-workflows
		const validDirNames = [".workflows", ".mcp-workflows"];
		const dirName = path.basename(absolutePath);
		if (!validDirNames.includes(dirName)) {
			console.error(
				`Config directory must be named either .workflows or .mcp-workflows, found ${dirName}, using default configuration`,
			);
			return defaultConfig;
		}

		// Read all YAML files in the directory
		const files = fs
			.readdirSync(absolutePath)
			.filter(
				(file) =>
					file.toLowerCase().endsWith(".yaml") ||
					file.toLowerCase().endsWith(".yml"),
			);

		if (files.length === 0) {
			console.error(
				`No YAML files found in ${absolutePath}, using default configuration`,
			);
			return defaultConfig;
		}

		// Merge all configurations
		const mergedConfig: DevToolsConfig = {};

		for (const file of files) {
			const filePath = path.join(absolutePath, file);
			console.error(`Loading config from: ${filePath}`);

			try {
				const content = fs.readFileSync(filePath, "utf8");
				const fileConfig = yaml.load(content) as DevToolsConfig;

				if (typeof fileConfig !== "object") {
					console.error(`Config in ${filePath} must be an object, skipping`);
					continue;
				}

				// Merge this file's config into the overall config
				mergeConfigs(mergedConfig, fileConfig);
			} catch (error_: unknown) {
				const errorMessage =
					error_ instanceof Error ? error_.message : String(error_);
				console.error(
					`Error loading config from ${filePath}: ${errorMessage}, skipping`,
				);
			}
		}

		return mergedConfig;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Error loading configs from directory: ${errorMessage}`);
		return defaultConfig;
	}
}

/**
 * Synchronous version of loadConfig for easier testing
 *
 * @param {string} [directoryPath] - Path to the directory containing configuration YAML files
 * @returns {DevToolsConfig} The loaded and merged configuration
 */
export function loadConfigSync(directoryPath?: string): DevToolsConfig {
	if (!directoryPath) {
		console.error(
			"No config directory path provided, using default configuration",
		);
		return defaultConfig;
	}

	try {
		// Resolve absolute path
		const absolutePath = path.resolve(directoryPath);

		// Check if directory exists and is a directory
		if (
			!fs.existsSync(absolutePath) ||
			!fs.statSync(absolutePath).isDirectory()
		) {
			console.error(
				`Config directory not found or is not a directory at ${absolutePath}, using default configuration`,
			);
			return defaultConfig;
		}

		// Check if directory name is either .workflows or .mcp-workflows
		const validDirNames = [".workflows", ".mcp-workflows"];
		const dirName = path.basename(absolutePath);
		if (!validDirNames.includes(dirName)) {
			console.error(
				`Config directory must be named either .workflows or .mcp-workflows, found ${dirName}, using default configuration`,
			);
			return defaultConfig;
		}

		// Read all YAML files in the directory
		const files = fs
			.readdirSync(absolutePath)
			.filter(
				(file) =>
					file.toLowerCase().endsWith(".yaml") ||
					file.toLowerCase().endsWith(".yml"),
			);

		if (files.length === 0) {
			console.error(
				`No YAML files found in ${absolutePath}, using default configuration`,
			);
			return defaultConfig;
		}

		// Merge all configurations
		const mergedConfig: DevToolsConfig = {};

		for (const file of files) {
			const filePath = path.join(absolutePath, file);
			console.error(`Loading config from: ${filePath}`);

			try {
				const content = fs.readFileSync(filePath, "utf8");
				const fileConfig = yaml.load(content) as DevToolsConfig;

				if (typeof fileConfig !== "object") {
					console.error(`Config in ${filePath} must be an object, skipping`);
					continue;
				}

				// Merge this file's config into the overall config
				mergeConfigs(mergedConfig, fileConfig);
			} catch (error_: unknown) {
				const errorMessage =
					error_ instanceof Error ? error_.message : String(error_);
				console.error(
					`Error loading config from ${filePath}: ${errorMessage}, skipping`,
				);
			}
		}

		return mergedConfig;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Error loading configs from directory: ${errorMessage}`);
		return defaultConfig;
	}
}

/**
 * Validates the configuration of a specific tool
 * Note: This function validates the tool definition itself, not the runtime parameters
 * (which are validated by the schema validation mechanism)
 *
 * @param {DevToolsConfig} config - The complete tool configuration
 * @param {string} toolName - The name of the tool to validate
 * @returns {string|null} Error message if invalid, null if valid
 */
export function validateToolConfig(
	config: DevToolsConfig,
	toolName: string,
): string | null {
	try {
		// Get the tool configuration
		const toolConfig = config[toolName];
		if (!toolConfig) {
			return `Tool "${toolName}" not found in configuration`;
		}

		// If the tool has parameters, validate them
		if (toolConfig.parameters) {
			for (const [paramName, param] of Object.entries(toolConfig.parameters)) {
				// Check parameter type
				if (!param.type) {
					return `Parameter "${paramName}" is missing type property`;
				}

				const validTypes = new Set([
					"string",
					"number",
					"boolean",
					"array",
					"object",
					"enum",
				]);
				if (!validTypes.has(param.type)) {
					return `Parameter "${paramName}" has invalid type "${param.type}"`;
				}

				// For enum types, check that enum values are provided
				if (
					param.type === "enum" &&
					(!param.enum || !Array.isArray(param.enum) || param.enum.length === 0)
				) {
					return `Parameter "${paramName}" of type "enum" must have a non-empty enum array`;
				}

				// Recursively validate nested parameters
				if (param.type === "object" && param.properties) {
					for (const [nestedName, nestedParam] of Object.entries(
						param.properties,
					)) {
						if (!nestedParam.type) {
							return `Nested parameter "${nestedName}" in "${paramName}" is missing type property`;
						}

						if (!validTypes.has(nestedParam.type)) {
							return `Nested parameter "${nestedName}" in "${paramName}" has invalid type "${nestedParam.type}"`;
						}

						// Recursively validate deeper nested structures
						const nestedValidation = validateNestedParameter(
							nestedParam,
							`${paramName}.${nestedName}`,
						);
						if (nestedValidation) {
							return nestedValidation;
						}
					}
				}

				// Validate array item types
				if (param.type === "array" && param.items) {
					if (!param.items.type) {
						return `Items in array parameter "${paramName}" must specify a type`;
					}

					if (!validTypes.has(param.items.type)) {
						return `Items in array parameter "${paramName}" have invalid type "${param.items.type}"`;
					}

					// Recursively validate array item if it's a complex type
					const itemValidation = validateNestedParameter(
						param.items,
						`${paramName} items`,
					);
					if (itemValidation) {
						return itemValidation;
					}
				}
			}
		}

		return null;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return `Error validating tool configuration: ${errorMessage}`;
	}
}

/**
 * Helper function to recursively validate a nested parameter
 * @param {ParameterConfig} param - Parameter configuration to validate
 * @param {string} path - Path to the parameter (for error reporting)
 * @returns {string|null} Error message if invalid, null if valid
 */
function validateNestedParameter(
	param: ParameterConfig,
	path: string,
): string | null {
	const validTypes = new Set([
		"string",
		"number",
		"boolean",
		"array",
		"object",
		"enum",
	]);

	// For enum types, check that enum values are provided
	if (
		param.type === "enum" &&
		(!param.enum || !Array.isArray(param.enum) || param.enum.length === 0)
	) {
		return `Parameter "${path}" of type "enum" must have a non-empty enum array`;
	}

	// Recursively validate nested objects
	if (param.type === "object" && param.properties) {
		for (const [nestedName, nestedParam] of Object.entries(param.properties)) {
			if (!nestedParam.type) {
				return `Nested parameter "${nestedName}" in "${path}" is missing type property`;
			}

			if (!validTypes.has(nestedParam.type)) {
				return `Nested parameter "${nestedName}" in "${path}" has invalid type "${nestedParam.type}"`;
			}

			const nestedValidation = validateNestedParameter(
				nestedParam,
				`${path}.${nestedName}`,
			);
			if (nestedValidation) {
				return nestedValidation;
			}
		}
	}

	// Validate array item types
	if (param.type === "array" && param.items) {
		if (!param.items.type) {
			return `Items in array parameter "${path}" must specify a type`;
		}

		if (!validTypes.has(param.items.type)) {
			return `Items in array parameter "${path}" have invalid type "${param.items.type}"`;
		}

		const itemValidation = validateNestedParameter(
			param.items,
			`${path} items`,
		);
		if (itemValidation) {
			return itemValidation;
		}
	}

	return null;
}

/**
 * Converts parameter configuration to JSON Schema format
 * @param {Record<string, ParameterConfig>} parameters - Parameter configurations
 * @returns {object} JSON Schema object
 */
export function convertParametersToJsonSchema(
	parameters: Record<string, ParameterConfig>,
): any {
	const properties: Record<string, any> = {};
	const required: string[] = [];

	for (const [name, param] of Object.entries(parameters)) {
		if (param.required) {
			required.push(name);
		}

		properties[name] = convertParameterToJsonSchema(param);
	}

	// Fix the schema format to be compatible with MCP SDK
	const schema = {
		type: "object",
		properties,
		...(required.length > 0 ? { required } : {}),
	};

	return schema;
}

/**
 * Converts a single parameter configuration to JSON Schema
 * @param {ParameterConfig} param - Parameter configuration
 * @returns {object} JSON Schema for the parameter
 */
export function convertParameterToJsonSchema(param: ParameterConfig): any {
	const schema: any = {};

	switch (param.type) {
		case "string": {
			schema.type = "string";
			break;
		}
		case "number": {
			schema.type = "number";
			break;
		}
		case "boolean": {
			schema.type = "boolean";
			break;
		}
		case "array": {
			schema.type = "array";
			schema.items = param.items
				? convertParameterToJsonSchema(param.items)
				: { type: "string" };
			break;
		}
		case "object": {
			schema.type = "object";
			if (param.properties) {
				const nestedSchema = convertParametersToJsonSchema(param.properties);
				schema.properties = nestedSchema.properties;
				if (nestedSchema.required && nestedSchema.required.length > 0) {
					schema.required = nestedSchema.required;
				}
			} else {
				schema.additionalProperties = true;
			}
			break;
		}
		case "enum": {
			if (param.enum && param.enum.length > 0) {
				const firstValue = param.enum[0];
				schema.type = typeof firstValue === "number" ? "number" : "string";
				schema.enum = param.enum;
			} else {
				schema.type = "string";
				schema.enum = [];
			}
			break;
		}
	}

	if (param.description) {
		schema.description = param.description;
	}

	if (param.default !== undefined) {
		schema.default = param.default;
	}

	return schema;
}

/**
 * Converts parameter configuration to Zod schema
 * @param {Record<string, ParameterConfig>} parameters - Parameter configurations
 * @returns {object} Zod schema object for use with MCP SDK
 */
export function convertParametersToZodSchema(
	parameters: Record<string, ParameterConfig>,
): Record<string, z.ZodTypeAny> {
	const schemaObj: Record<string, z.ZodTypeAny> = {};

	for (const [name, param] of Object.entries(parameters)) {
		let schema = convertParameterToZodSchema(param);

		// If parameter is required, don't add .optional()
		if (!param.required) {
			schema = schema.optional();
		}

		schemaObj[name] = schema;
	}

	return schemaObj;
}

/**
 * Converts a single parameter configuration to a Zod schema
 * @param {ParameterConfig} param - Parameter configuration
 * @returns {z.ZodTypeAny} Zod schema for the parameter
 */
export function convertParameterToZodSchema(
	param: ParameterConfig,
): z.ZodTypeAny {
	let schema: z.ZodTypeAny;

	switch (param.type) {
		case "string": {
			schema = z.string();
			break;
		}
		case "number": {
			schema = z.number();
			break;
		}
		case "boolean": {
			schema = z.boolean();
			break;
		}
		case "array": {
			if (param.items) {
				// Create array with the specific item type
				schema = z.array(convertParameterToZodSchema(param.items));
			} else {
				// Default to array of strings if item type not specified
				schema = z.array(z.string());
			}
			break;
		}
		case "object": {
			if (param.properties) {
				// Create object with specific properties
				const propertySchemas = convertParametersToZodSchema(param.properties);
				schema = z.object(propertySchemas);
			} else {
				// Default to record of unknown if properties not specified
				schema = z.record(z.unknown());
			}
			break;
		}
		case "enum": {
			if (param.enum && param.enum.length > 0) {
				const firstValue = param.enum[0];
				if (typeof firstValue === "number") {
					// For numeric enums, we need to handle them differently
					// Since z.nativeEnum expects an actual TypeScript enum,
					// we'll use z.union of z.literal values
					schema = z.union(
						param.enum.map((value) => z.literal(value)) as [
							z.ZodLiteral<any>,
							z.ZodLiteral<any>,
							...z.ZodLiteral<any>[],
						],
					);
				} else {
					// For string enums, use regular enum
					schema = z.enum(param.enum as [string, ...string[]]);
				}
			} else {
				// Default to empty string enum if enum values not provided
				schema = z.enum([""] as [string, ...string[]]);
			}
			break;
		}
		default: {
			// Default to string for unknown types
			schema = z.string();
		}
	}

	// Add description if available
	if (param.description) {
		schema = schema.describe(param.description);
	}

	// Add default value if specified
	if (param.default !== undefined) {
		schema = schema.default(param.default);
	}

	return schema;
}
