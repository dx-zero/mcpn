# DevTools MCP Automated Testing Plan

This document outlines how to run automated tests for the DevTools MCP server using the built-in MCP client.

## Overview

The automated testing suite validates the DevTools MCP server against all the test scenarios defined in the manual testing plan. It uses a purpose-built MCP client to connect to the server and verify its behavior in various configurations.

## Prerequisites

Before running the tests, ensure you have:

1. Node.js 18+ installed
2. The repository cloned and dependencies installed (`npm install`)
3. TypeScript compiled (`npm run build`)

## Running the Tests

To run the full automated test suite:

```bash
cd mcp-server
npm run mcp-test
```

This command will:

1. Compile the TypeScript code
2. Create necessary test directories and configuration files
3. Run all the test scenarios

## Test Structure

The tests are organized into the following categories:

1. **Basic Scenarios**: Tests the server with default and invalid configurations
2. **Preset Scenarios**: Tests different preset combinations (thinking, coding, multiple presets, etc.)
3. **Configuration Scenarios**: Tests loading configurations from directories
4. **Configuration Content Tests**: Tests specific configuration overrides and custom tools

## Test Coverage

The automated tests cover all the test scenarios defined in `testing-plan.md`, including:

| Category                    | Test IDs | Description                                                                    |
| --------------------------- | -------- | ------------------------------------------------------------------------------ |
| Basic Scenarios             | B1-B3    | Default run, invalid arguments, help command                                   |
| Preset Scenarios            | P1-P7    | Various preset combinations including thinking, coding, multiple presets, etc. |
| Configuration Scenarios     | C1-C5    | Loading configs from directories, non-existent paths, etc.                     |
| Configuration Content Tests | CC1-CC10 | Override descriptions, prompts, custom tools, tool disabling, etc.             |
| Edge Cases                  | E1-E7    | Large prompts, Unicode characters, special characters, etc.                    |

## Configuration Options

The DevTools MCP server supports the following configuration options:

### Tool Configuration

Each tool in a YAML config file can have these properties:

| Property      | Type    | Description                                      |
| ------------- | ------- | ------------------------------------------------ |
| `description` | string  | Custom description for the tool                  |
| `prompt`      | string  | Custom prompt text for the tool                  |
| `context`     | string  | Additional context to append to the prompt       |
| `tools`       | array   | List of sub-tools to include in the prompt       |
| `toolMode`    | string  | "sequential" or "situational" mode for sub-tools |
| `disabled`    | boolean | Whether to disable this tool                     |
| `name`        | string  | Optional custom name to register the tool with   |

The `name` parameter allows you to override the registered name of a tool. This is useful for avoiding conflicts with other MCP servers that might use the same tool names. If not provided, the key in the configuration file is used as the tool name.

Example:

```yaml
debugger_mode:
  name: "custom_debugger" # Will be registered as "custom_debugger" instead of "debugger_mode"
  description: "A debugger tool with a custom name"
```

## Implementation Details

The automated tests use:

1. A custom `McpTestClient` class that wraps the MCP SDK client
2. Mocha as the test runner
3. Chai for assertions
4. Dynamic creation of test configuration files

The client connects to the server using the STDIO transport, which allows it to run the server in a child process and communicate with it directly.

## Adding New Tests

To add new test scenarios:

1. Define the scenario in `__tests__/server-configs.test.ts` or create a new test file
2. Follow the existing test patterns
3. Use the `client.connect()` method with appropriate arguments
4. Verify the server behavior with assertions

Example:

```typescript
it("should load custom tool configuration", async () => {
  await client.connect(["--config", "./path/to/config"]);
  const tools = await client.listTools();

  // Verify the custom tool is available
  const customTool = tools.tools.find((t) => t.name === "my_custom_tool");
  expect(customTool).to.exist;
  expect(customTool.description).to.equal("My custom tool description");
});
```

## Troubleshooting

If tests are failing:

1. **Connection issues**: Ensure the server is starting correctly by checking the stderr output (logged to console)
2. **Missing tools**: Verify the preset and configuration files exist and contain the expected tools
3. **Timeout errors**: Increase the timeout in the test file if the server takes too long to start
4. **Path issues**: Check that the paths to test directories are correct

## Edge Cases

The automated tests verify several edge cases:

1. **Large prompts**: Tests loading tools with very large prompt texts
2. **Unicode characters**: Tests support for tools with Unicode names and descriptions
3. **Special characters**: Tests tools with special characters in descriptions and prompts
4. **Tool merging logic**: Tests that tools are correctly merged when loaded from multiple sources

## Conclusion

The automated testing system provides a comprehensive way to verify the functionality of the DevTools MCP server. It covers all the scenarios in the manual testing plan while being much faster and more reliable to run.
