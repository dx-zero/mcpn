/**
 * Shared utility functions for MCP server
 */

import { ToolConfig } from "./config.js";

/**
 * Interface for a tool in the tools list
 */
export interface ToolItem {
  name: string;
  description?: string;
  prompt?: string;
  optional?: boolean;
}

/**
 * Formats tools into a consistent list structure regardless of input format
 *
 * @param tools - Tools configuration in either string or object format
 * @returns Array of formatted tool items
 */
export function formatToolsList(
  tools: string | Record<string, string | ToolConfig> | undefined
): ToolItem[] {
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
      } else if (typeof value === "object" && value !== null) {
        // Full format: toolName: { description: "desc", prompt: "prompt", optional: true }
        return {
          name,
          description: (value as any).description || "",
          prompt: (value as any).prompt || "",
          optional: (value as any).optional || false,
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
 * @param text - The base prompt text to append tools to
 * @param toolsList - List of tools to format
 * @param toolMode - Mode for tool usage (sequential or situational/dynamic)
 * @returns The prompt text with appended tools section
 */
export function appendFormattedTools(
  text: string,
  toolsList: ToolItem[],
  toolMode?: "sequential" | "situational"
): string {
  if (toolsList.length === 0) {
    return text;
  }

  text += "\n\n## Available Tools\n";

  if (toolMode === "sequential") {
    text +=
      "If all required user input/feedback is acquired or if no input/feedback is needed, execute this exact sequence of tools to complete this task:\n\n";

    toolsList.forEach((tool, index) => {
      text += `${index + 1}. ${tool.name}`;
      if (
        (!tool.prompt && tool.description) ||
        (tool.prompt && tool.description)
      ) {
        text += `: `;
      }
      if (tool.description) {
        text += `${tool.description}`;
      }
      if (tool.prompt && tool.description) {
        text += ` - `;
      }
      if (tool.prompt && !tool.description) {
        text += `: `;
      }
      if (tool.prompt) {
        text += `${tool.prompt}`;
      }
      if (tool.optional) {
        text += ` (Optional)`;
      }
      text += "\n";
    });
  } else {
    // Default to dynamic mode
    text += `Use these tools as needed to complete the user's request:\n\n`;

    toolsList.forEach((tool) => {
      text += `- ${tool.name}`;
      if (
        (!tool.prompt && tool.description) ||
        (tool.prompt && tool.description)
      ) {
        text += `: `;
      }
      if (tool.description) {
        text += `${tool.description}`;
      }
      if (tool.prompt && tool.description) {
        text += ` - `;
      }
      if (tool.prompt && !tool.description) {
        text += `: `;
      }
      if (tool.prompt) {
        text += `${tool.prompt}`;
      }
      if (tool.optional) {
        text += ` (Optional)`;
      }
      text += "\n";
    });
  }

  return (text +=
    "\nAfter using each tool, return a 'Next Steps' section with a list of the next steps to take / remaining tools to invoke along with each tool's prompt/description and 'optional' flag if present.");
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
  params: Record<string, any>
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
    }
  );

  return { result, usedParams };
}
