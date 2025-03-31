# Typed Parameters for MCP Tools

This document explains how to use typed parameters in your MCP tool configurations.

## Overview

The MCP server now supports defining typed parameters for your tools. These parameters will be:

1. Validated according to their type and constraints
2. Converted to a JSON Schema for the MCP tool definition
3. Available to your tool implementation when called

## Configuration Format

Parameters are defined in your YAML configuration files under the `parameters` key:

```yaml
my_tool:
  name: "my_custom_tool"
  description: "A tool that does something"
  parameters:
    query:
      type: "string"
      description: "The search query"
      required: true
    limit:
      type: "number"
      description: "Maximum number of results"
      default: 10
    filterType:
      type: "enum"
      enum: ["all", "active", "completed"]
      description: "Type of filter to apply"
      default: "all"
```

## Supported Parameter Types

The following parameter types are supported:

| Type      | Description              | Example                                     |
| --------- | ------------------------ | ------------------------------------------- |
| `string`  | Text values              | `"hello world"`                             |
| `number`  | Numeric values           | `42`, `3.14`                                |
| `boolean` | True/false values        | `true`, `false`                             |
| `array`   | List of values           | `["item1", "item2"]`                        |
| `object`  | Complex object           | `{"key": "value"}`                          |
| `enum`    | One of predefined values | `"active"` (from `["active", "completed"]`) |

## Parameter Properties

Each parameter supports the following properties:

| Property      | Description                             | Required                 |
| ------------- | --------------------------------------- | ------------------------ |
| `type`        | The data type                           | Yes                      |
| `description` | Human-readable description              | No                       |
| `required`    | Whether the parameter is required       | No (defaults to `false`) |
| `default`     | Default value if not provided           | No                       |
| `enum`        | Array of valid values (for `enum` type) | Yes (for `enum` type)    |

## Example Tools

See `mcp-server/src/presets/examples.yaml` for example tools with typed parameters.

## Accessing Parameters

When using the `server.tool()` function, your parameters will be passed to the callback function:

```typescript
server.tool(
  "calculator",
  "Perform calculations",
  inputSchema,
  async (params) => {
    const { expression, precision } = params;
    const result = evaluate(expression);
    return {
      content: [{ type: "text", text: result.toFixed(precision || 2) }],
    };
  }
);
```

## Implementation Details

The typed parameters are converted to JSON Schema format according to the MCP protocol specification. This allows tools to have rich, type-safe inputs while maintaining compatibility with the MCP standard.
