import type { JsonSchema, ZodSchemaMap } from "./common";

// --- Configuration Types ---

/** Represents a parameter for a tool */
export interface ParameterConfig {
	/** Type of the parameter */
	type: "string" | "number" | "boolean" | "array" | "object" | "enum";
	/** Description of what the parameter does */
	description?: string;
	/** Whether the parameter is required */
	required?: boolean;
	/** Default value for the parameter */
	default?: any; // Keeping 'any' for flexibility with default values
	/** Possible values for enum type parameters */
	enum?: (string | number)[];
	/** For array types, defines the type of items in the array */
	items?: ParameterConfig;
	/** For object types, defines the properties of the object */
	properties?: Record<string, ParameterConfig>;
}

/** Represents a tool that can be used in a prompt */
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

/** Possible structures for the 'tools' property in PromptConfig */
export type PromptTools = Record<string, string | ToolConfig> | string;

/** Configuration for a specific prompt */
export interface PromptConfig {
	/** If provided, completely replaces the default prompt */
	prompt?: string;
	/** Additional context to append to the prompt (either default or custom) */
	context?: string;
	/** Available tools for this prompt */
	tools?: PromptTools;
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

/** Main configuration interface for all developer tools */
export interface DevToolsConfig {
	[key: string]: PromptConfig | undefined;
}
