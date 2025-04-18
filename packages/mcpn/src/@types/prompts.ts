import type { TemplateParams } from "./common";
import type { DevToolsConfig } from "./config";

// --- Prompt Function Types ---

/** Type definition for a function that generates a prompt */
export type PromptFunction = (
	config?: DevToolsConfig,
	params?: TemplateParams,
) => string;

/** Type for the object storing prompt functions for all modes */
export type PromptFunctionsMap = Record<string, PromptFunction>;

/** Interface for a tool item used in formatted lists */
export interface ToolItem {
	name: string;
	description?: string;
	prompt?: string;
	optional?: boolean;
}
