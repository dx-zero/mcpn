import { describe, it, expect } from "vitest";
import {
  processTemplate,
  formatToolsList,
  appendFormattedTools,
} from "../src/utils.js";

describe("Utility Functions", function () {
  describe("processTemplate", function () {
    it("should replace template parameters with values", function () {
      const template = "Hello {{name}}, welcome to {{location}}!";
      const params = {
        name: "John",
        location: "Paris",
      };

      const { result, usedParams } = processTemplate(template, params);

      expect(result).toBe("Hello John, welcome to Paris!");
      expect(usedParams.size).toBe(2);
      expect(usedParams.has("name")).toBe(true);
      expect(usedParams.has("location")).toBe(true);
    });

    it("should handle empty params", function () {
      const template = "Hello {{name}}, welcome!";
      const { result, usedParams } = processTemplate(template, {});

      expect(result).toBe("Hello {{name}}, welcome!");
      expect(usedParams.size).toBe(0);
    });

    it("should handle missing parameters", function () {
      const template = "Hello {{name}}, welcome to {{location}}!";
      const params = {
        name: "John",
      };

      const { result, usedParams } = processTemplate(template, params);

      expect(result).toBe("Hello John, welcome to {{location}}!");
      expect(usedParams.size).toBe(1);
      expect(usedParams.has("name")).toBe(true);
    });

    it("should handle whitespace in parameters", function () {
      const template = "Hello {{ name }}, welcome to {{  location  }}!";
      const params = {
        name: "John",
        location: "Paris",
      };

      const { result, usedParams } = processTemplate(template, params);

      expect(result).toBe("Hello John, welcome to Paris!");
      expect(usedParams.size).toBe(2);
    });

    it("should handle undefined template", function () {
      const template = undefined as unknown as string;
      const params = {
        name: "John",
      };

      // @ts-ignore - Testing with undefined
      const { result, usedParams } = processTemplate(template, params);

      // The function should handle undefined gracefully
      expect(result).toBe(""); // Should return empty string for undefined
      expect(usedParams.size).toBe(0);
    });

    it("should convert non-string parameter values to strings", function () {
      const template = "Count: {{count}}, Active: {{active}}";
      const params = {
        count: 42,
        active: true,
      };

      const { result, usedParams } = processTemplate(template, params);

      expect(result).toBe("Count: 42, Active: true");
      expect(usedParams.size).toBe(2);
    });
  });

  describe("formatToolsList", function () {
    it("should format string-based tools list", function () {
      const tools = "tool1, tool2, tool3";
      const result = formatToolsList(tools);

      expect(result).toHaveLength(3);
      expect(result[0]!.name).toBe("tool1");
      expect(result[1]!.name).toBe("tool2");
      expect(result[2]!.name).toBe("tool3");
    });

    it("should format object-based tools with string descriptions", function () {
      const tools = {
        tool1: "Description 1",
        tool2: "Description 2",
      };

      const result = formatToolsList(tools);

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe("tool1");
      expect(result[0]!.description).toBe("Description 1");
      expect(result[1]!.name).toBe("tool2");
      expect(result[1]!.description).toBe("Description 2");
    });

    it("should format object-based tools with full config", function () {
      const tools = {
        tool1: {
          description: "Description 1",
          prompt: "Prompt 1",
          optional: true,
        } as any,
        tool2: {
          description: "Description 2",
        } as any,
      };

      const result = formatToolsList(tools);

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe("tool1");
      expect(result[0]!.description).toBe("Description 1");
      expect(result[0]!.prompt).toBe("Prompt 1");
      expect(result[0]!.optional).toBe(true);

      expect(result[1]!.name).toBe("tool2");
      expect(result[1]!.description).toBe("Description 2");
      expect(result[1]!.optional).toBe(false);
    });

    it("should handle undefined tools", function () {
      const result = formatToolsList(undefined);
      expect(result).toEqual([]);
    });

    it("should handle empty string tools", function () {
      const result = formatToolsList("");
      // Empty string with special handling in the implementation
      expect(result[0]!.name).toBe("");
    });
  });

  describe("appendFormattedTools", function () {
    it("should append tools in sequential mode", function () {
      const baseText = "Base prompt text";
      const tools = [
        { name: "tool1", description: "Description 1" },
        { name: "tool2", description: "Description 2", prompt: "Prompt 2" },
        { name: "tool3", description: "Description 3", optional: true },
      ];

      const result = appendFormattedTools(baseText, tools, "sequential");

      expect(result).toContain("Base prompt text");
      expect(result).toContain("## Available Tools");
      expect(result).toContain("1. tool1: Description 1");
      expect(result).toContain("2. tool2: Description 2 - Prompt 2");
      expect(result).toContain("3. tool3: Description 3 (Optional)");
      expect(result).toContain("exact sequence of tools");
    });

    it("should append tools in situational mode", function () {
      const baseText = "Base prompt text";
      const tools = [
        { name: "tool1", description: "Description 1" },
        { name: "tool2", prompt: "Prompt 2" },
        { name: "tool3", description: "Description 3", optional: true },
      ];

      const result = appendFormattedTools(baseText, tools, "situational");

      expect(result).toContain("Base prompt text");
      expect(result).toContain("## Available Tools");
      expect(result).toContain("- tool1: Description 1");
      expect(result).toContain("- tool2: Prompt 2");
      expect(result).toContain("- tool3: Description 3 (Optional)");
      expect(result).toContain("Use these tools as needed");
    });

    it("should default to situational mode if not specified", function () {
      const baseText = "Base prompt text";
      const tools = [{ name: "tool1", description: "Description 1" }];

      const result = appendFormattedTools(baseText, tools);

      expect(result).toContain("Use these tools as needed");
      expect(result).not.toContain("exact sequence of tools");
    });

    it("should handle empty tools list", function () {
      const baseText = "Base prompt text";
      const tools: any[] = [];

      const result = appendFormattedTools(baseText, tools);

      expect(result).toBe("Base prompt text");
      expect(result).not.toContain("## Available Tools");
    });

    it("should handle tools with just prompt", function () {
      const baseText = "Base prompt text";
      const tools = [{ name: "tool1", prompt: "Just a prompt" }];

      const result = appendFormattedTools(baseText, tools);

      expect(result).toContain("- tool1: Just a prompt");
    });
  });
});
