import type { TemplateParams } from "./common";

// --- Tool Execution Types ---

/** Represents a single item in the content array returned by a tool */
export interface ToolResultContentItem {
	type: "text";
	text: string;
	[x: string]: unknown;
}

/** Represents the structured result returned by a tool execution */
export interface ToolResult {
	content: ToolResultContentItem[];
	isError?: boolean;
	[x: string]: unknown;
}

/** Type definition for the callback function executed by a tool */
export type ToolCallback = (params?: TemplateParams) => Promise<ToolResult>;
