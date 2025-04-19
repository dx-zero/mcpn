import { describe, it, expect } from "vitest";
import type { DevToolsConfig, ParameterConfig } from "../src/@types/config.js";
import {
	convertParameterToJsonSchema,
	convertParametersToJsonSchema,
	validateToolConfig,
} from "../src/config.js";

describe("Advanced Parameter Handling", () => {
	describe("Nested Objects Validation", () => {
	it("should validate nested object structures", () => {
		const config: DevToolsConfig = {
		testTool: {
			name: "test_tool",
			parameters: {
			settings: {
				type: "object",
				description: "Configuration settings",
				properties: {
				performance: {
					type: "object",
					description: "Performance settings",
					properties: {
					level: {
						type: "number",
						description: "Performance level",
					},
					optimizeFor: {
						type: "enum",
						enum: ["speed", "memory", "balanced"],
						description: "Optimization target",
					},
					},
				},
				},
			},
			},
		},
		};

		const result = validateToolConfig(config, "testTool");
		expect(result).toBeNull();
	});

	it("should catch invalid nested object structures", () => {
		const config: DevToolsConfig = {
		testTool: {
			name: "test_tool",
			parameters: {
			settings: {
				type: "object",
				description: "Configuration settings",
				properties: {
				performance: {
					type: "object",
					description: "Performance settings",
					properties: {
					level: {
						// intentionally invalid type
						type: "invalid_type" as any,
						description: "Performance level",
					},
					},
				},
				},
			},
			},
		},
		};

		const result = validateToolConfig(config, "testTool");
		expect(result).not.toBeNull();
		expect(result).toContain("invalid type");
	});
	});

	describe("Array Items Validation", () => {
	it("should validate array with typed items", () => {
		const config: DevToolsConfig = {
		testTool: {
			name: "test_tool",
			parameters: {
			data: {
				type: "array",
				description: "Data points",
				items: {
				type: "number",
				description: "Numeric data point",
				},
			},
			},
		},
		};

		const result = validateToolConfig(config, "testTool");
		expect(result).toBeNull();
	});

	it("should catch invalid array item types", () => {
		const config: DevToolsConfig = {
		testTool: {
			name: "test_tool",
			parameters: {
			data: {
				type: "array",
				description: "Data points",
				items: {
				type: "invalid" as any,
				description: "Invalid data point type",
				},
			},
			},
		},
		};

		const result = validateToolConfig(config, "testTool");
		expect(result).not.toBeNull();
		expect(result).toContain("invalid type");
	});
	});

	describe("Complex Parameter Schema Conversion", () => {
	it("should convert nested object structure to JSON Schema", () => {
		const parameters: Record<string, ParameterConfig> = {
		settings: {
			type: "object",
			description: "Configuration settings",
			required: true,
			properties: {
			performance: {
				type: "object",
				description: "Performance settings",
				properties: {
				level: {
					type: "number",
					description: "Performance level",
					default: 3,
				},
				optimizeFor: {
					type: "enum",
					enum: ["speed", "memory", "balanced"],
					description: "Optimization target",
					default: "balanced",
				},
				},
			},
			security: {
				type: "object",
				description: "Security settings",
				properties: {
				enabled: {
					type: "boolean",
					description: "Whether security is enabled",
					default: true,
				},
				},
			},
			},
		},
		};

		const schema = convertParametersToJsonSchema(parameters);

		expect(schema.type).toBe("object");
		expect(schema.required).toEqual(["settings"]);
		expect(schema.properties.settings.type).toBe("object");
		expect(schema.properties.settings.properties.performance.type).toBe(
		"object"
		);
		expect(
		schema.properties.settings.properties.performance.properties.level.type
		).toBe("number");
		expect(
		schema.properties.settings.properties.performance.properties.optimizeFor.enum
		).toEqual(["speed", "memory", "balanced"]);
	});

	it("should convert array with typed items to JSON Schema", () => {
		const parameters: Record<string, ParameterConfig> = {
		data: {
			type: "array",
			description: "Data points",
			items: {
			type: "number",
			description: "Numeric data point",
			},
		},
		};

		const schema = convertParametersToJsonSchema(parameters);

		expect(schema.type).toBe("object");
		expect(schema.properties.data.type).toBe("array");
		expect(schema.properties.data.items.type).toBe("number");
	});

	it("should convert array of enum types to JSON Schema", () => {
		const parameters: Record<string, ParameterConfig> = {
		operations: {
			type: "array",
			description: "Operations to perform",
			items: {
			type: "enum",
			enum: ["sum", "average", "min", "max"],
			description: "Operation type",
			},
		},
		};

		const schema = convertParametersToJsonSchema(parameters);

		expect(schema.type).toBe("object");
		expect(schema.properties.operations.type).toBe("array");
		expect(schema.properties.operations.items.type).toBe("string");
		expect(schema.properties.operations.items.enum).toEqual([
		"sum",
		"average",
		"min",
		"max",
		]);
	});
	});

	describe("Numeric Enum Handling", () => {
	it("should correctly identify numeric enum types", () => {
		const parameters: Record<string, ParameterConfig> = {
		level: {
			type: "enum",
			enum: [1, 2, 3, 4, 5],
			description: "Performance level (1-5)",
			default: 3,
		},
		};

		const schema = convertParametersToJsonSchema(parameters);

		expect(schema.properties.level.type).toBe("number");
		expect(schema.properties.level.enum).toEqual([1, 2, 3, 4, 5]);
	});

	it("should handle mixed enum types (defaulting to string)", () => {
		const parameters: Record<string, ParameterConfig> = {
		mixed: {
			type: "enum",
			// intentionally using mixed types
			enum: ["low", 1, "medium", 2, "high"] as any,
			description: "Mixed enum values",
		},
		};

		const schema = convertParametersToJsonSchema(parameters);

		expect(schema.properties.mixed.type).toBe("string");
		expect(schema.properties.mixed.enum).toEqual([
		"low",
		1,
		"medium",
		2,
		"high",
		]);
	});
	});

	describe("Full Advanced Tool Configuration", () => {
	it("should validate the complete advanced tool from examples.yaml", () => {
		const config: DevToolsConfig = {
		advanced_tool: {
			name: "advanced_configuration",
			description: "Configure a system with complex parameters",
			parameters: {
			name: {
				type: "string",
				description: "Name of the configuration",
				required: true,
			},
			settings: {
				type: "object",
				description: "Configuration settings",
				required: true,
				properties: {
				performance: {
					type: "object",
					description: "Performance settings",
					properties: {
					level: {
						type: "enum",
						enum: [1, 2, 3, 4, 5],
						description: "Performance level (1-5)",
						default: 3,
					},
					optimizeFor: {
						type: "enum",
						enum: ["speed", "memory", "balanced"],
						description: "What to optimize for",
						default: "balanced",
					},
					},
				},
				security: {
					type: "object",
					description: "Security settings",
					properties: {
					enabled: {
						type: "boolean",
						description: "Whether security is enabled",
						default: true,
					},
					levels: {
						type: "array",
						description: "Security levels to apply",
						items: {
						type: "string",
						},
					},
					},
				},
				},
			},
			tags: {
				type: "array",
				description: "Tags for this configuration",
				items: {
				type: "string",
				},
			},
			timeout: {
				type: "number",
				description: "Timeout in seconds",
				default: 30,
			},
			},
		},
		};

		const result = validateToolConfig(config, "advanced_tool");
		expect(result).toBeNull();

		const schema = convertParametersToJsonSchema(
		config.advanced_tool?.parameters!
		);
		expect(schema.type).toBe("object");
		expect(schema.required).toEqual(["name", "settings"]);

		expect(
		schema.properties.settings.properties.performance.properties.level.enum
		).toEqual([1, 2, 3, 4, 5]);
		expect(
		schema.properties.settings.properties.security.properties.levels.type
		).toBe("array");

		expect(schema.properties.tags.items.type).toBe("string");
	});
	});

	describe("Individual Parameter Schema Conversion", () => {
	it("should convert individual string parameter to JSON Schema", () => {
		const param: ParameterConfig = {
		type: "string",
		description: "A string parameter",
		default: "default value",
		};

		const schema = convertParameterToJsonSchema(param);
		expect(schema.type).toBe("string");
		expect(schema.description).toBe("A string parameter");
		expect(schema.default).toBe("default value");
	});

	it("should convert individual enum parameter to JSON Schema", () => {
		const param: ParameterConfig = {
		type: "enum",
		enum: ["option1", "option2", "option3"],
		description: "An enum parameter",
		default: "option2",
		};

		const schema = convertParameterToJsonSchema(param);
		expect(schema.type).toBe("string");
		expect(schema.enum).toEqual(["option1", "option2", "option3"]);
		expect(schema.default).toBe("option2");
	});

	it("should convert individual numeric enum parameter to JSON Schema", () => {
		const param: ParameterConfig = {
		type: "enum",
		enum: [1, 2, 3, 4, 5],
		description: "A numeric enum parameter",
		default: 3,
		};

		const schema = convertParameterToJsonSchema(param);
		expect(schema.type).toBe("number");
		expect(schema.enum).toEqual([1, 2, 3, 4, 5]);
		expect(schema.default).toBe(3);
	});

	it("should convert individual array parameter with items to JSON Schema", () => {
		const param: ParameterConfig = {
		type: "array",
		description: "An array parameter",
		items: {
			type: "string",
			description: "String item",
		},
		};

		const schema = convertParameterToJsonSchema(param);
		expect(schema.type).toBe("array");
		expect(schema.items.type).toBe("string");
	});
	});
});