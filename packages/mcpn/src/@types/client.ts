import type { TemplateParams } from "./common";

// Type definitions for MCP Test Client interactions

export interface Tool {
	name: string;
	description?: string;
	inputSchema?: any; // Define a more specific type if possible
}

export interface ListToolsResponse {
	tools: Tool[];
	// Add other potential properties like nextCursor if needed
}

export interface ContentItem {
	text?: string; // Make text optional
	type?: string;
	// Allow other potential properties
	[key: string]: any;
}

export interface CallToolResponse {
	content: ContentItem[];
	// Add other potential properties if needed
}
