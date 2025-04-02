/// <reference types="node" />
/// <reference types="mocha" />

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import { McpTestClient } from "../src/client.js";
import {
	type DevToolsConfig,
	type ParameterConfig,
	convertParametersToJsonSchema,
	loadConfigSync,
	validateToolConfig,
} from "../src/config.js";
import { processTemplate } from "../src/utils.js";

// Create dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to test workflows
const TEST_WORKFLOWS_DIR = path.join(__dirname, "test-workflows", ".workflows");

describe("Tool Parameters Configuration", () => {
	describe("Parameter Validation", () => {
		it("should validate basic parameter types", () => {
			const config: DevToolsConfig = {
				testTool: {
					name: "test_tool",
					parameters: {
						stringParam: {
							type: "string",
							description: "A string parameter",
						},
						numberParam: {
							type: "number",
							description: "A number parameter",
						},
						booleanParam: {
							type: "boolean",
							description: "A boolean parameter",
						},
					},
				},
			};

			const result = validateToolConfig(config, "testTool");
			expect(result).to.be.null;
		});

		it("should validate enum parameter type", () => {
			const config: DevToolsConfig = {
				testTool: {
					name: "test_tool",
					parameters: {
						enumParam: {
							type: "enum",
							enum: ["option1", "option2", "option3"],
							description: "An enum parameter",
						},
					},
				},
			};

			const result = validateToolConfig(config, "testTool");
			expect(result).to.be.null;
		});

		it("should catch invalid parameter type", () => {
			const config: DevToolsConfig = {
				testTool: {
					name: "test_tool",
					parameters: {
						badParam: {
							// @ts-ignore - Intentionally using an invalid type for testing
							type: "invalid",
							description: "A parameter with invalid type",
						},
					},
				},
			};

			const result = validateToolConfig(config, "testTool");
			expect(result).to.not.be.null;
			expect(result).to.contain("invalid type");
		});

		it("should catch enum parameter without enum values", () => {
			const config: DevToolsConfig = {
				testTool: {
					name: "test_tool",
					parameters: {
						enumParam: {
							type: "enum",
							description: "An enum parameter without enum values",
						},
					},
				},
			};

			const result = validateToolConfig(config, "testTool");
			expect(result).to.not.be.null;
			expect(result).to.contain("must have a non-empty enum array");
		});
	});

	describe("JSON Schema Conversion", () => {
		it("should convert string parameter to JSON Schema", () => {
			const parameters: Record<string, ParameterConfig> = {
				query: {
					type: "string",
					description: "Search query",
					required: true,
				},
			};

			const schema = convertParametersToJsonSchema(parameters);

			expect(schema).to.deep.equal({
				type: "object",
				properties: {
					query: {
						type: "string",
						description: "Search query",
					},
				},
				required: ["query"],
			});
		});

		it("should convert number parameter to JSON Schema", () => {
			const parameters: Record<string, ParameterConfig> = {
				limit: {
					type: "number",
					description: "Result limit",
					default: 10,
				},
			};

			const schema = convertParametersToJsonSchema(parameters);

			expect(schema).to.deep.equal({
				type: "object",
				properties: {
					limit: {
						type: "number",
						description: "Result limit",
						default: 10,
					},
				},
			});
		});

		it("should convert enum parameter to JSON Schema", () => {
			const parameters: Record<string, ParameterConfig> = {
				sortOrder: {
					type: "enum",
					enum: ["asc", "desc"],
					description: "Sort order",
					default: "asc",
				},
			};

			const schema = convertParametersToJsonSchema(parameters);

			expect(schema).to.deep.equal({
				type: "object",
				properties: {
					sortOrder: {
						type: "string",
						enum: ["asc", "desc"],
						description: "Sort order",
						default: "asc",
					},
				},
			});
		});

		it("should convert multiple parameters to JSON Schema", () => {
			const parameters: Record<string, ParameterConfig> = {
				query: {
					type: "string",
					description: "Search query",
					required: true,
				},
				limit: {
					type: "number",
					description: "Result limit",
					default: 10,
				},
				includeArchived: {
					type: "boolean",
					description: "Include archived items",
					default: false,
				},
				sortOrder: {
					type: "enum",
					enum: ["asc", "desc"],
					description: "Sort order",
					default: "asc",
				},
			};

			const schema = convertParametersToJsonSchema(parameters);

			expect(schema).to.deep.equal({
				type: "object",
				properties: {
					query: {
						type: "string",
						description: "Search query",
					},
					limit: {
						type: "number",
						description: "Result limit",
						default: 10,
					},
					includeArchived: {
						type: "boolean",
						description: "Include archived items",
						default: false,
					},
					sortOrder: {
						type: "string",
						enum: ["asc", "desc"],
						description: "Sort order",
						default: "asc",
					},
				},
				required: ["query"],
			});
		});
	});

	describe("Tool Configuration Loading", () => {
		before(() => {
			// Create test config file with parameters
			const configContent = `
parameterized_tool:
  name: "param_tool"
  description: "Tool with parameters"
  parameters:
    query:
      type: "string"
      description: "The search query"
      required: true
    limit:
      type: "number"
      description: "Maximum number of results"
      default: 10
    includeArchived:
      type: "boolean"
      description: "Whether to include archived items"
      default: false
    filterType:
      type: "enum"
      enum: ["all", "recent", "popular"]
      description: "Type of filter to apply"
      default: "all"
  prompt: |
    This is a test tool that uses parameters.
`;

			// Ensure test directory exists
			if (!fs.existsSync(TEST_WORKFLOWS_DIR)) {
				fs.mkdirSync(TEST_WORKFLOWS_DIR, { recursive: true });
			}

			// Write test config file
			fs.writeFileSync(
				path.join(TEST_WORKFLOWS_DIR, "parameters.yaml"),
				configContent,
			);
		});

		after(() => {
			// Clean up test config file
			const configPath = path.join(TEST_WORKFLOWS_DIR, "parameters.yaml");
			if (fs.existsSync(configPath)) {
				fs.unlinkSync(configPath);
			}
		});

		it("should load configuration with parameters", () => {
			const config = loadConfigSync(TEST_WORKFLOWS_DIR);

			// Verify the config was loaded correctly
			expect(config).to.have.property("parameterized_tool");
			// TypeScript safety - we already checked the property exists
			if (!config.parameterized_tool) {
				throw new Error("parameterized_tool not found in config");
			}
			expect(config.parameterized_tool).to.have.property("parameters");

			// Verify parameters
			const params = config.parameterized_tool.parameters;
			if (!params) {
				throw new Error("parameters not found in parameterized_tool");
			}
			expect(params).to.have.property("query");
			expect(params.query.type).to.equal("string");
			expect(params.query.required).to.be.true;

			expect(params).to.have.property("limit");
			expect(params.limit.type).to.equal("number");
			expect(params.limit.default).to.equal(10);

			expect(params).to.have.property("filterType");
			expect(params.filterType.type).to.equal("enum");
			expect(params.filterType.enum).to.deep.equal([
				"all",
				"recent",
				"popular",
			]);
		});
	});

	describe("Thinking Mode Parameters", () => {
		it("should validate generate_thought parameters", () => {
			// Create a test config with generate_thought parameters
			const config: DevToolsConfig = {
				generate_thought: {
					name: "generate_thought",
					description: "Test generate_thought parameters",
					parameters: {
						thought: {
							type: "string" as const,
							description: "A thought to deeply reflect upon",
							required: true,
						},
					},
				},
			};

			const result = validateToolConfig(config, "generate_thought");
			expect(result).to.be.null;

			// Make sure generate_thought is defined in the config
			if (!config.generate_thought || !config.generate_thought.parameters) {
				throw new Error("generate_thought or its parameters are not defined");
			}

			// Convert parameters to JSON Schema
			const schema = convertParametersToJsonSchema(
				config.generate_thought.parameters,
			);

			// Verify the schema
			expect(schema).to.deep.equal({
				type: "object",
				properties: {
					thought: {
						type: "string",
						description: "A thought to deeply reflect upon",
					},
				},
				required: ["thought"],
			});
		});
	});

	describe("Template Parameter Injection", () => {
		it("should process template strings with parameters", () => {
			const template = "Search for {{query}} with limit {{limit}}";
			const params = {
				query: "test keywords",
				limit: 10,
			};

			const { result, usedParams } = processTemplate(template, params);

			expect(result).to.equal("Search for test keywords with limit 10");
			expect(usedParams.size).to.equal(2);
			expect(usedParams.has("query")).to.be.true;
			expect(usedParams.has("limit")).to.be.true;
		});

		it("should create templated tool configurations", () => {
			// Create test config file with templated parameters
			const configContent = `
templated_tool:
  name: "template_tool"
  description: "Tool with template parameters"
  prompt: |
    This is a tool that uses {{placeholder}} templates.
    The user wants to search for {{query}} with up to {{limit}} results.
  parameters:
    query:
      type: "string"
      description: "The search query"
      required: true
    limit:
      type: "number"
      description: "Maximum number of results"
      default: 10
    placeholder:
      type: "string"
      description: "Type of templates to use"
      default: "parameter"
`;

			// Ensure test directory exists
			if (!fs.existsSync(TEST_WORKFLOWS_DIR)) {
				fs.mkdirSync(TEST_WORKFLOWS_DIR, { recursive: true });
			}

			// Write test config file
			fs.writeFileSync(
				path.join(TEST_WORKFLOWS_DIR, "templated.yaml"),
				configContent,
			);

			try {
				const config = loadConfigSync(TEST_WORKFLOWS_DIR);

				// Verify the config was loaded correctly
				expect(config).to.have.property("templated_tool");
				if (!config.templated_tool) {
					throw new Error("templated_tool not found in config");
				}

				// Check that prompt contains template placeholders
				expect(config.templated_tool.prompt).to.include("{{placeholder}}");
				expect(config.templated_tool.prompt).to.include("{{query}}");
				expect(config.templated_tool.prompt).to.include("{{limit}}");

				// Process the template with parameters
				const prompt = config.templated_tool.prompt || "";
				const params = {
					placeholder: "dynamic",
					query: "test query",
					limit: 5,
				};

				const { result, usedParams } = processTemplate(prompt, params);

				// Verify template processing
				expect(result).to.include("dynamic templates");
				expect(result).to.include("search for test query");
				expect(result).to.include("up to 5 results");
				expect(usedParams.size).to.equal(3);
			} finally {
				// Clean up test config file
				const configPath = path.join(TEST_WORKFLOWS_DIR, "templated.yaml");
				if (fs.existsSync(configPath)) {
					fs.unlinkSync(configPath);
				}
			}
		});
	});
});
