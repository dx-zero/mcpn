import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  convertParameterToZodSchema,
  convertParametersToZodSchema,
} from "../src/config.js";
import type { ParameterConfig } from "../src/@types/config.js";

describe("Zod Schema Conversion", () => {
  describe("Basic Type Conversion", () => {
    it("should convert string parameter to Zod schema", () => {
      const param: ParameterConfig = {
        type: "string",
        description: "A string parameter",
        required: true,
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).toBeInstanceOf(z.ZodString);
      expect(schema._def.typeName).toEqual("ZodString");

      // Test validation
      expect(schema.parse("test")).toEqual("test");
      expect(() => schema.parse(123)).toThrow();
    });

    it("should convert number parameter to Zod schema", () => {
      const param: ParameterConfig = {
        type: "number",
        description: "A number parameter",
        required: true,
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).toBeInstanceOf(z.ZodNumber);
      expect(schema._def.typeName).toEqual("ZodNumber");

      // Test validation
      expect(schema.parse(123)).toEqual(123);
      expect(() => schema.parse("test")).toThrow();
    });

    it("should convert boolean parameter to Zod schema", () => {
      const param: ParameterConfig = {
        type: "boolean",
        description: "A boolean parameter",
        required: true,
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).toBeInstanceOf(z.ZodBoolean);
      expect(schema._def.typeName).toEqual("ZodBoolean");

      // Test validation
      expect(schema.parse(true)).toEqual(true);
      expect(() => schema.parse("test")).toThrow();
    });
  });

  describe("Complex Type Conversion", () => {
    it("should convert array parameter to Zod schema", () => {
      const param: ParameterConfig = {
        type: "array",
        description: "An array parameter",
        items: {
          type: "number",
          description: "Number array item",
        },
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).toBeInstanceOf(z.ZodArray);
      expect(schema._def.typeName).toEqual("ZodArray");

      // Test validation
      expect(schema.parse([1, 2, 3])).toEqual([1, 2, 3]);
      expect(() => schema.parse(["a", "b", "c"])).toThrow();
    });

    it("should convert object parameter to Zod schema", () => {
      const param: ParameterConfig = {
        type: "object",
        description: "An object parameter",
        properties: {
          name: {
            type: "string",
            description: "Name property",
            required: true,
          },
          age: {
            type: "number",
            description: "Age property",
          },
        },
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).toBeInstanceOf(z.ZodObject);
      expect(schema._def.typeName).toEqual("ZodObject");

      // Test validation
      expect(schema.parse({ name: "John", age: 30 })).toEqual({
        name: "John",
        age: 30,
      });
      expect(schema.parse({ name: "John" })).toEqual({ name: "John" });
      expect(() => schema.parse({ age: 30 })).toThrow();
    });

    it("should convert enum parameter to Zod schema", () => {
      const param: ParameterConfig = {
        type: "enum",
        description: "An enum parameter",
        enum: ["option1", "option2", "option3"],
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).toBeInstanceOf(z.ZodEnum);
      expect(schema._def.typeName).toEqual("ZodEnum");

      // Test validation
      expect(schema.parse("option1")).toEqual("option1");
      expect(() => schema.parse("option4")).toThrow();
    });

    it("should convert numeric enum parameter to Zod schema", () => {
      const param: ParameterConfig = {
        type: "enum",
        description: "A numeric enum parameter",
        enum: [1, 2, 3],
      };

      const schema = convertParameterToZodSchema(param);
      // Numeric enums are often represented as unions of literals in Zod
      expect(schema).toBeInstanceOf(z.ZodUnion);
      expect(schema._def.typeName).toEqual("ZodUnion");


      // We're using a union of literals for numeric enums
      // Test validation
      expect(schema.parse(1)).toEqual(1);
      expect(() => schema.parse(4)).toThrow();
    });
  });

  describe("Optional Parameters", () => {
    it("should handle optional parameters correctly", () => {
      const params: Record<string, ParameterConfig> = {
        requiredParam: {
          type: "string",
          description: "Required parameter",
          required: true,
        },
        optionalParam: {
          type: "number",
          description: "Optional parameter",
          required: false,
        },
      };

      const schema = convertParametersToZodSchema(params);
      expect(schema).toBeTypeOf("object"); // Check if it's an object first
      expect(schema.requiredParam).toBeInstanceOf(z.ZodString);
      expect(schema.requiredParam?._def.typeName).toEqual("ZodString");
      expect(schema.optionalParam).toBeInstanceOf(z.ZodOptional);
      expect(schema.optionalParam?._def.typeName).toEqual("ZodOptional");


      // Test validation
      const zodObject = z.object(schema);
      expect(
        zodObject.parse({ requiredParam: "test", optionalParam: 123 })
      ).toEqual({
        requiredParam: "test",
        optionalParam: 123,
      });
      expect(zodObject.parse({ requiredParam: "test" })).toEqual({
        requiredParam: "test",
      });
      expect(() => zodObject.parse({ optionalParam: 123 })).toThrow();
    });
  });

  describe("Nested Structures", () => {
    it("should handle nested object structures", () => {
      const params: Record<string, ParameterConfig> = {
        settings: {
          type: "object",
          description: "Settings object",
          required: true,
          properties: {
            display: {
              type: "object",
              description: "Display settings",
              properties: {
                theme: {
                  type: "enum",
                  enum: ["light", "dark", "system"],
                  description: "UI theme",
                  required: true,
                },
                fontSize: {
                  type: "number",
                  description: "Font size in px",
                  default: 16,
                },
              },
            },
            notifications: {
              type: "boolean",
              description: "Enable notifications",
              default: true,
            },
          },
        },
      };

      const schema = convertParametersToZodSchema(params);
      expect(schema).toBeTypeOf("object");
      expect(schema.settings).toBeInstanceOf(z.ZodObject);
      expect(schema.settings?._def.typeName).toEqual("ZodObject");

      // Test validation with nested object
      const zodObject = z.object(schema);
      const validObject = {
        settings: {
          display: {
            theme: "dark",
            fontSize: 14,
          },
          notifications: false,
        },
      };
      expect(zodObject.parse(validObject)).toEqual(validObject);

      // Test missing required nested field
      const invalidObject = {
        settings: {
          display: {
            fontSize: 14, // Missing theme
          },
          notifications: true,
        },
      };
      expect(() => zodObject.parse(invalidObject)).toThrow();
    });
  });
});
