import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { McpTestClient } from "../src/client.js";
import type { DevToolsConfig, ParameterConfig } from "../src/@types/config.js";
import {
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
		expect(result).toBeNull();
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
		expect(result).toBeNull();
	});

	it("should catch invalid parameter type", () => {
		const config: DevToolsConfig = {
		testTool: {
			name: "test_tool",
			parameters: {
			badParam: {
				// intentionally using an invalid type
				type: "invalid" as any,
				description: "A parameter with invalid type",
			},
			},
		},
		};

		const result = validateToolConfig(config, "testTool");
		expect(result).not.toBeNull();
		expect(result).toContain("invalid type");
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
		expect(result).not.toBeNull();
		expect(result).toContain("must have a non-empty enum array");
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

		expect(schema).toEqual({
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

		expect(schema).toEqual({
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

		expect(schema).toEqual({
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

		expect(schema).toEqual({
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
	let configPath: string;

	beforeAll(() => {
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

		if (!fs.existsSync(TEST_WORKFLOWS_DIR)) {
		fs.mkdirSync(TEST_WORKFLOWS_DIR, { recursive: true });
		}

		const filePath = path.join(TEST_WORKFLOWS_DIR, "parameters.yaml");
		fs.writeFileSync(filePath, configContent);
		configPath = filePath;
	});

	afterAll(() => {
		// Clean up test config file
		const filePath = path.join(TEST_WORKFLOWS_DIR, "parameters.yaml");
		if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath);
		}
	});

	it("should load configuration with parameters", () => {
		const config = loadConfigSync(TEST_WORKFLOWS_DIR);

		expect(config).toHaveProperty("parameterized_tool");
		if (!config.parameterized_tool) {
		throw new Error("parameterized_tool not found in config");
		}
		expect(config.parameterized_tool).toHaveProperty("parameters");

		const params = config.parameterized_tool.parameters;
		if (!params) {
		throw new Error("parameters not found in parameterized_tool");
		}
		expect(params).toHaveProperty("query");
		expect(params.query!.type).toBe("string");
		expect(params.query!.required).toBe(true);

		expect(params).toHaveProperty("limit");
		expect(params.limit!.type).toBe("number");
		expect(params.limit!.default).toBe(10);

		expect(params).toHaveProperty("filterType");
		expect(params.filterType!.type).toBe("enum");
		expect(params.filterType!.enum).toEqual(["all", "recent", "popular"]);
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
				type: "string",
				description: "A thought to deeply reflect upon",
				required: true,
			},
			},
		},
		};

		const result = validateToolConfig(config, "generate_thought");
		expect(result).toBeNull();

		if (!config.generate_thought || !config.generate_thought.parameters) {
		throw new Error("generate_thought or its parameters are not defined");
		}

		const schema = convertParametersToJsonSchema(
		config.generate_thought.parameters
		);

		expect(schema).toEqual({
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

		expect(result).toBe("Search for test keywords with limit 10");
		expect(usedParams.size).toBe(2);
		expect(usedParams.has("query")).toBe(true);
		expect(usedParams.has("limit")).toBe(true);
	});

	it("should create templated tool configurations", () => {
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

		if (!fs.existsSync(TEST_WORKFLOWS_DIR)) {
		fs.mkdirSync(TEST_WORKFLOWS_DIR, { recursive: true });
		}

		const templateFilePath = path.join(TEST_WORKFLOWS_DIR, "templated.yaml");
		fs.writeFileSync(templateFilePath, configContent);

		try {
		const config = loadConfigSync(TEST_WORKFLOWS_DIR);

		expect(config).toHaveProperty("templated_tool");
		if (!config.templated_tool) {
			throw new Error("templated_tool not found in config");
		}

		expect(config.templated_tool.prompt).toContain("{{placeholder}}");
		expect(config.templated_tool.prompt).toContain("{{query}}");
		expect(config.templated_tool.prompt).toContain("{{limit}}");

		const prompt = config.templated_tool.prompt || "";
		const params = {
			placeholder: "dynamic",
			query: "test query",
			limit: 5,
		};

		const { result, usedParams } = processTemplate(prompt, params);

		expect(result).toContain("dynamic templates");
		expect(result).toContain("search for test query");
		expect(result).toContain("up to 5 results");
		expect(usedParams.size).toBe(3);
		} finally {
		const configPath = path.join(TEST_WORKFLOWS_DIR, "templated.yaml");
		if (fs.existsSync(configPath)) {
			fs.unlinkSync(configPath);
		}
		}
	});
	});
});