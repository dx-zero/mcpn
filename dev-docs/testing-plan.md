# DevTools MCP Testing Plan

This document outlines the testing plan for the DevTools MCP server, covering both automated and manual testing to ensure all variations and edge cases are properly tested.

## Automated Testing

Our automated test suite in the `test` directory covers:

1. Basic server configuration scenarios
2. Preset loading and combinations
3. Configuration file loading and validation
4. Tool overrides and custom tools
5. Edge cases with malformed configs

To run the automated tests:

```bash
npm test
```

## Manual Testing Setup

1. Ensure port 3000 is available on your machine
2. Run the following command to start the Anthropic MCP testing tool:
   ```bash
   npm run inspect
   ```
3. In the MCP testing tool:
   - Set Transport Type to `STDIO`
   - Set Command to `node`
   - When testing, use arguments in this format: `dist/server.js [--config path/to/.workflows] [--preset preset1,preset2]`

## Manual Test Scenarios

### 1. Basic Scenarios

| Test ID | Description               | Command Arguments              | Expected Result                                                                   | Automated? |
| ------- | ------------------------- | ------------------------------ | --------------------------------------------------------------------------------- | ---------- |
| B1      | Default run               | `dist/server.js`               | Only thinking tools loaded (thinking_mode)                                        | Yes        |
| B2      | Invalid command line args | `dist/server.js --invalid arg` | Server should start with default configuration (thinking preset) and log an error | Yes        |
| B3      | Help command              | `dist/server.js --help`        | Should display help text if implemented, or start normally if not                 | No         |

### 2. Preset Scenarios

| Test ID | Description         | Command Arguments                            | Expected Result                                                    | Automated? |
| ------- | ------------------- | -------------------------------------------- | ------------------------------------------------------------------ | ---------- |
| P1      | Thinking preset     | `dist/server.js --preset thinking`           | Only thinking tools loaded                                         | Yes        |
| P2      | Coding preset       | `dist/server.js --preset coding`             | Only coding tools loaded (debugger_mode, architecture_mode, etc.)  | Yes        |
| P3      | Multiple presets    | `dist/server.js --preset coding,thinking`    | All tools from both presets loaded                                 | Yes        |
| P4      | Duplicate presets   | `dist/server.js --preset thinking,thinking`  | Each tool loaded only once                                         | Yes        |
| P5      | Non-existent preset | `dist/server.js --preset nonexistent`        | Server starts with no tools loaded, logs an error                  | Yes        |
| P6      | Mixed valid/invalid | `dist/server.js --preset coding,nonexistent` | Only coding tools loaded, logs an error for the nonexistent preset | No         |
| P7      | Empty preset arg    | `dist/server.js --preset ""`                 | No presets loaded, server starts with no tools                     | No         |
| P8      | Test preset         | `dist/server.js --preset test`               | Test mode tools loaded (added for testing data-driven approach)    | Yes        |

### 3. Configuration Scenarios

| Test ID | Description                     | Command Arguments                                                     | Expected Result                                                              | Automated? |
| ------- | ------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------- |
| C1      | Basic config                    | `dist/server.js --config ./test-workflows/.workflows`                 | Configs loaded from directory (check logs)                                   | Yes        |
| C2      | Config with preset              | `dist/server.js --config ./test-workflows/.workflows --preset coding` | Config overrides preset where there's overlap                                | Yes        |
| C3      | Non-existent config path        | `dist/server.js --config ./nonexistent`                               | Server starts with default configuration, logs an error                      | Yes        |
| C4      | Config path is not .workflows   | `dist/server.js --config ./test-workflows/not-workflows`              | Server starts with default configuration, logs an error                      | Yes        |
| C5      | Empty config directory          | `dist/server.js --config ./test-workflows/empty-workflows`            | Server starts with default configuration, logs that no YAML files were found | Yes        |
| C6      | .mcp-workflows directory        | `dist/server.js --config ./test-workflows/.mcp-workflows`             | Custom MCP tools loaded from .mcp-workflows                                  | Yes        |
| C7      | Multiple config dirs (priority) | `dist/server.js --config ./test-workflows/.workflows,.mcp-workflows`  | Tools from both directories with proper override precedence                  | No         |

### 4. Configuration Content Tests

| Test ID | Description               | Config File               | Expected Result                                           | Automated? |
| ------- | ------------------------- | ------------------------- | --------------------------------------------------------- | ---------- |
| CC1     | Override tool description | override-description.yaml | Tool description should match the override                | Yes        |
| CC2     | Override tool prompt      | override-prompt.yaml      | Tool prompt should match the override                     | Yes        |
| CC3     | Override tool context     | override-context.yaml     | Tool should include the overridden context                | Yes        |
| CC4     | Disable a tool            | disable-tool.yaml         | Disabled tool should not be available                     | Yes        |
| CC5     | Custom tool               | custom-tool.yaml          | Custom tool should be available with specified properties | Yes        |
| CC6     | Tool with tools array     | tools-array.yaml          | Tool should display the sub-tools in the prompt           | Yes        |
| CC7     | Sequential tools          | sequential-tools.yaml     | Tool should format tools in sequential order              | Yes        |
| CC8     | Invalid toolMode          | invalid-toolmode.yaml     | Server should log a validation error                      | Yes        |
| CC9     | Empty tool config         | empty-tool.yaml           | Tool should use default properties                        | Yes        |
| CC10    | Malformed YAML            | malformed.yaml            | Server should log an error and skip this file             | Yes        |
| CC11    | Override all properties   | override.yaml             | All overridden properties should take effect              | Yes        |
| CC12    | Custom name tool          | custom-name.yaml          | Tool with specified custom name should be available       | Yes        |

### 5. Edge Cases

| Test ID | Description                           | Setup                                       | Expected Result                                            | Automated? |
| ------- | ------------------------------------- | ------------------------------------------- | ---------------------------------------------------------- | ---------- |
| E1      | Very large prompt                     | large-prompt.yaml                           | Server should handle it without crashing                   | Yes        |
| E2      | Very large number of tools            | many-tools.yaml                             | Server should handle it without crashing                   | Yes        |
| E3      | Unicode characters                    | unicode.yaml                                | Server should handle it correctly                          | Yes        |
| E4      | Special characters                    | special-chars.yaml                          | Server should handle it correctly                          | Yes        |
| E5      | Empty directory name                  | `dist/server.js --config ""`                | Server should handle it gracefully                         | No         |
| E6      | Very long tool name                   | long-name.yaml                              | Server should handle it correctly                          | Yes        |
| E7      | Multiple tool configs                 | multiple files                              | Configs properly merged (verify tools array concatenation) | Yes        |
| E8      | High concurrency tool usage           | Run multiple tools simultaneously           | Server maintains stability under load                      | No         |
| E9      | Server restart after configuration    | Change config files then restart server     | Server should load updated configurations                  | No         |
| E10     | Configuration hot-reload (if enabled) | Change config files while server is running | Server should detect and apply changes                     | No         |

## Interactive Testing

Beyond configuration testing, it's important to verify the actual functionality of tools when used by an LLM:

1. **Tool Functionality Testing**: For each tool, verify that:

   - The tool responds correctly to valid inputs
   - The tool handles invalid inputs gracefully
   - The prompt and context are delivered correctly to the LLM
   - Any sub-tools are properly accessible

2. **End-to-End Workflow Testing**:

   - Test complete workflows involving multiple tools
   - Verify that tools work together seamlessly
   - Check that context is preserved appropriately between tool invocations

3. **LLM Interaction Testing**:
   - Verify that the LLM can properly understand and use each tool
   - Test complex scenarios requiring the LLM to choose appropriate tools
   - Ensure proper handling of tool chains and sequences

## Troubleshooting

- If the server doesn't start, check port 3000 isn't in use
- If communication fails, ensure the transport type is set to STDIO
- Check logs for error messages about loading configurations
- Verify the paths to config directories are correct (they must be named `.workflows` or `.mcp-workflows`)
- For test failures, examine the server logs for detailed error information
- When testing presets, ensure they're correctly defined in the presets directory

## Test File Reference

The automated tests use test files located in `test/test-workflows/`. These files can also be used for manual testing to verify specific behaviors:

### Standard Config Tests

- `override-description.yaml`: Tests overriding tool description
- `override-prompt.yaml`: Tests overriding tool prompt
- `disable-tool.yaml`: Tests disabling tools
- `custom-tool.yaml`: Tests creating custom tools
- `override-context.yaml`: Tests adding custom context
- `tools-example.yaml`: Tests tools array definition
- `sequential-tools.yaml`: Tests sequential tool mode
- `empty-tool.yaml`: Tests minimal tool configuration

### Edge Case Tests

- `malformed.yaml`: Tests handling of invalid YAML
- `large-prompt.yaml`: Tests handling large prompt text
- `long-name.yaml`: Tests very long tool names
- `many-tools.yaml`: Tests handling of many tools
- `unicode.yaml`: Tests Unicode character handling
- `special-chars.yaml`: Tests special character handling
- `invalid-toolmode.yaml`: Tests validation of tool modes

These test files serve as both automated test fixtures and examples for manual testing.
