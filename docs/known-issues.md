# Known Issues

## MCP SDK Schema Validation Issue

### Description

When using parameterized tools with the MCP SDK, there is an issue with schema validation. The MCP SDK appears to be using the Zod validation library internally, but our JSON Schema format is not fully compatible with what Zod expects.

### Error

```
MCP error -32603: keyValidator._parse is not a function
```

### Root Cause

Based on similar issues in Zod, this error occurs when passing a plain JavaScript object (`{}`) when Zod expects a schema created with `z.object({})`. The MCP SDK is likely attempting to use Zod to validate the schema we're generating in `convertParametersToJsonSchema()`.

### Current Workaround

In our tests, we've worked around this by capturing and handling the specific error. We verify the tool exists and has the correct name/description, but we currently can't validate parameter passing without this error.

### Potential Solution

A proper fix would be to either:

1. Modify our `convertParametersToJsonSchema()` function to generate Zod-compatible schemas by using the `zod-to-json-schema` library or similar.
2. Extend the MCP SDK to better handle plain JSON Schema objects that weren't created with Zod.

### References

- [GitHub issue #3408 in Zod](https://github.com/colinhacks/zod/issues/3408) - Similar error about keyValidator.\_parse
- [zod-to-json-schema](https://github.com/StefanTerdell/zod-to-json-schema) - A library that converts between Zod schemas and JSON Schema
