import type { z } from "zod";

// --- Basic and Configuration Types ---

/** Generic type for template parameters */
export type TemplateParams = Record<string, any>;

/** Basic representation of package.json content */
export type PackageInfo = Record<string, any>;

/** Basic representation of a JSON Schema object */
export type JsonSchema = Record<string, any>;

/** Type for a map of parameter names to Zod schema types */
export type ZodSchemaMap = Record<string, z.ZodTypeAny>;
/** Interface for parsed command line arguments */
export interface CommandLineArgs {
	configPath?: string;
	presets: string[];
}
