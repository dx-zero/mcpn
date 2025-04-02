/// <reference types="node" />
/// <reference types="mocha" />

import { expect } from "chai";
import {
	appendFormattedTools,
	formatToolsList,
	processTemplate,
} from "../src/utils.js";

describe("Utility Functions", () => {
	describe("processTemplate", () => {
		it("should replace template parameters with values", () => {
			const template = "Hello {{name}}, welcome to {{location}}!";
			const params = {
				name: "John",
				location: "Paris",
			};

			const { result, usedParams } = processTemplate(template, params);

			expect(result).to.equal("Hello John, welcome to Paris!");
			expect(usedParams.size).to.equal(2);
			expect(usedParams.has("name")).to.be.true;
			expect(usedParams.has("location")).to.be.true;
		});

		it("should handle empty params", () => {
			const template = "Hello {{name}}, welcome!";
			const { result, usedParams } = processTemplate(template, {});

			expect(result).to.equal("Hello {{name}}, welcome!");
			expect(usedParams.size).to.equal(0);
		});

		it("should handle missing parameters", () => {
			const template = "Hello {{name}}, welcome to {{location}}!";
			const params = {
				name: "John",
			};

			const { result, usedParams } = processTemplate(template, params);

			expect(result).to.equal("Hello John, welcome to {{location}}!");
			expect(usedParams.size).to.equal(1);
			expect(usedParams.has("name")).to.be.true;
		});

		it("should handle whitespace in parameters", () => {
			const template = "Hello {{ name }}, welcome to {{  location  }}!";
			const params = {
				name: "John",
				location: "Paris",
			};

			const { result, usedParams } = processTemplate(template, params);

			expect(result).to.equal("Hello John, welcome to Paris!");
			expect(usedParams.size).to.equal(2);
		});

		it("should handle undefined template", () => {
			const template = undefined as unknown as string;
			const params = {
				name: "John",
			};

			// @ts-ignore - Testing with undefined
			const { result, usedParams } = processTemplate(template, params);

			// The function should handle undefined gracefully
			expect(result).to.equal(""); // Should return empty string for undefined
			expect(usedParams.size).to.equal(0);
		});

		it("should convert non-string parameter values to strings", () => {
			const template = "Count: {{count}}, Active: {{active}}";
			const params = {
				count: 42,
				active: true,
			};

			const { result, usedParams } = processTemplate(template, params);

			expect(result).to.equal("Count: 42, Active: true");
			expect(usedParams.size).to.equal(2);
		});
	});

	describe("formatToolsList", () => {
		it("should format string-based tools list", () => {
			const tools = "tool1, tool2, tool3";
			const result = formatToolsList(tools);

			expect(result).to.have.length(3);
			expect(result[0].name).to.equal("tool1");
			expect(result[1].name).to.equal("tool2");
			expect(result[2].name).to.equal("tool3");
		});

		it("should format object-based tools with string descriptions", () => {
			const tools = {
				tool1: "Description 1",
				tool2: "Description 2",
			};

			const result = formatToolsList(tools);

			expect(result).to.have.length(2);
			expect(result[0].name).to.equal("tool1");
			expect(result[0].description).to.equal("Description 1");
			expect(result[1].name).to.equal("tool2");
			expect(result[1].description).to.equal("Description 2");
		});

		it("should format object-based tools with full config", () => {
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

			expect(result).to.have.length(2);
			expect(result[0].name).to.equal("tool1");
			expect(result[0].description).to.equal("Description 1");
			expect(result[0].prompt).to.equal("Prompt 1");
			expect(result[0].optional).to.be.true;

			expect(result[1].name).to.equal("tool2");
			expect(result[1].description).to.equal("Description 2");
			expect(result[1].optional).to.be.false;
		});

		it("should handle undefined tools", () => {
			const result = formatToolsList(undefined);
			expect(result).to.be.an("array").that.is.empty;
		});

		it("should handle empty string tools", () => {
			const result = formatToolsList("");
			// Empty string with special handling in the implementation
			expect(result[0].name).to.equal("");
		});
	});

	describe("appendFormattedTools", () => {
		it("should append tools in sequential mode", () => {
			const baseText = "Base prompt text";
			const tools = [
				{ name: "tool1", description: "Description 1" },
				{ name: "tool2", description: "Description 2", prompt: "Prompt 2" },
				{ name: "tool3", description: "Description 3", optional: true },
			];

			const result = appendFormattedTools(baseText, tools, "sequential");

			expect(result).to.include("Base prompt text");
			expect(result).to.include("## Available Tools");
			expect(result).to.include("1. tool1: Description 1");
			expect(result).to.include("2. tool2: Description 2 - Prompt 2");
			expect(result).to.include("3. tool3: Description 3 (Optional)");
			expect(result).to.include("exact sequence of tools");
		});

		it("should append tools in situational mode", () => {
			const baseText = "Base prompt text";
			const tools = [
				{ name: "tool1", description: "Description 1" },
				{ name: "tool2", prompt: "Prompt 2" },
				{ name: "tool3", description: "Description 3", optional: true },
			];

			const result = appendFormattedTools(baseText, tools, "situational");

			expect(result).to.include("Base prompt text");
			expect(result).to.include("## Available Tools");
			expect(result).to.include("- tool1: Description 1");
			expect(result).to.include("- tool2: Prompt 2");
			expect(result).to.include("- tool3: Description 3 (Optional)");
			expect(result).to.include("Use these tools as needed");
		});

		it("should default to situational mode if not specified", () => {
			const baseText = "Base prompt text";
			const tools = [{ name: "tool1", description: "Description 1" }];

			const result = appendFormattedTools(baseText, tools);

			expect(result).to.include("Use these tools as needed");
			expect(result).to.not.include("exact sequence of tools");
		});

		it("should handle empty tools list", () => {
			const baseText = "Base prompt text";
			const tools: any[] = [];

			const result = appendFormattedTools(baseText, tools);

			expect(result).to.equal("Base prompt text");
			expect(result).to.not.include("## Available Tools");
		});

		it("should handle tools with just prompt", () => {
			const baseText = "Base prompt text";
			const tools = [{ name: "tool1", prompt: "Just a prompt" }];

			const result = appendFormattedTools(baseText, tools);

			expect(result).to.include("- tool1: Just a prompt");
		});
	});
});
