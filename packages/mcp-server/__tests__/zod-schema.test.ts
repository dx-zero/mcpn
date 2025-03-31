/// <reference types="node" />
/// <reference types="mocha" />

import { expect } from "chai";
import { z } from "zod";
import {
  convertParameterToZodSchema,
  convertParametersToZodSchema,
  ParameterConfig,
} from "../src/config.js";

describe("Zod Schema Conversion", function () {
  describe("Basic Type Conversion", function () {
    it("should convert string parameter to Zod schema", function () {
      const param: ParameterConfig = {
        type: "string",
        description: "A string parameter",
        required: true,
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).to.be.an("object");
      expect(schema._def.typeName).to.equal("ZodString");

      // Test validation
      expect(schema.parse("test")).to.equal("test");
      expect(() => schema.parse(123)).to.throw();
    });

    it("should convert number parameter to Zod schema", function () {
      const param: ParameterConfig = {
        type: "number",
        description: "A number parameter",
        required: true,
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).to.be.an("object");
      expect(schema._def.typeName).to.equal("ZodNumber");

      // Test validation
      expect(schema.parse(123)).to.equal(123);
      expect(() => schema.parse("test")).to.throw();
    });

    it("should convert boolean parameter to Zod schema", function () {
      const param: ParameterConfig = {
        type: "boolean",
        description: "A boolean parameter",
        required: true,
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).to.be.an("object");
      expect(schema._def.typeName).to.equal("ZodBoolean");

      // Test validation
      expect(schema.parse(true)).to.equal(true);
      expect(() => schema.parse("test")).to.throw();
    });
  });

  describe("Complex Type Conversion", function () {
    it("should convert array parameter to Zod schema", function () {
      const param: ParameterConfig = {
        type: "array",
        description: "An array parameter",
        items: {
          type: "number",
          description: "Number array item",
        },
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).to.be.an("object");
      expect(schema._def.typeName).to.equal("ZodArray");

      // Test validation
      expect(schema.parse([1, 2, 3])).to.deep.equal([1, 2, 3]);
      expect(() => schema.parse(["a", "b", "c"])).to.throw();
    });

    it("should convert object parameter to Zod schema", function () {
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
      expect(schema).to.be.an("object");
      expect(schema._def.typeName).to.equal("ZodObject");

      // Test validation
      expect(schema.parse({ name: "John", age: 30 })).to.deep.equal({
        name: "John",
        age: 30,
      });
      expect(schema.parse({ name: "John" })).to.deep.equal({ name: "John" });
      expect(() => schema.parse({ age: 30 })).to.throw();
    });

    it("should convert enum parameter to Zod schema", function () {
      const param: ParameterConfig = {
        type: "enum",
        description: "An enum parameter",
        enum: ["option1", "option2", "option3"],
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).to.be.an("object");
      expect(schema._def.typeName).to.equal("ZodEnum");

      // Test validation
      expect(schema.parse("option1")).to.equal("option1");
      expect(() => schema.parse("option4")).to.throw();
    });

    it("should convert numeric enum parameter to Zod schema", function () {
      const param: ParameterConfig = {
        type: "enum",
        description: "A numeric enum parameter",
        enum: [1, 2, 3],
      };

      const schema = convertParameterToZodSchema(param);
      expect(schema).to.be.an("object");
      expect(schema._def.typeName).to.equal("ZodUnion");

      // We're using a union of literals for numeric enums
      // Test validation
      expect(schema.parse(1)).to.equal(1);
      expect(() => schema.parse(4)).to.throw();
    });
  });

  describe("Optional Parameters", function () {
    it("should handle optional parameters correctly", function () {
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
      expect(schema).to.be.an("object");
      expect(schema.requiredParam._def.typeName).to.equal("ZodString");
      expect(schema.optionalParam._def.typeName).to.equal("ZodOptional");

      // Test validation
      const zodObject = z.object(schema);
      expect(
        zodObject.parse({ requiredParam: "test", optionalParam: 123 })
      ).to.deep.equal({
        requiredParam: "test",
        optionalParam: 123,
      });
      expect(zodObject.parse({ requiredParam: "test" })).to.deep.equal({
        requiredParam: "test",
      });
      expect(() => zodObject.parse({ optionalParam: 123 })).to.throw();
    });
  });

  describe("Nested Structures", function () {
    it("should handle nested object structures", function () {
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
      expect(schema).to.be.an("object");
      expect(schema.settings._def.typeName).to.equal("ZodObject");

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
      expect(zodObject.parse(validObject)).to.deep.equal(validObject);

      // Test missing required nested field
      const invalidObject = {
        settings: {
          display: {
            fontSize: 14,
          },
          notifications: true,
        },
      };
      expect(() => zodObject.parse(invalidObject)).to.throw();
    });
  });
});
