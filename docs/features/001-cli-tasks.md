# MCPN CLI Implementation Tasks and Testing Plan

## Overview

This document outlines the implementation tasks and testing plan for the MCPN CLI tool. The plan follows a strict test-driven development approach, where we'll create tests first and then implement the functionality to pass those tests.

## Important Notes

- All tests will be run locally during development (not through NPX)
- IDE integrations (Cursor, Windsurf, Cline, Rootcode) will be tested manually
- We'll approach this in phases, validating each phase before moving to the next
- For each feature, we will follow this TDD workflow:
  1. Write failing tests that define expected behavior
  2. Run tests to confirm they fail as expected
  3. Implement minimal code to make tests pass
  4. Run tests to confirm they pass
  5. Refactor while maintaining passing tests

## Test Environment Setup

- [ ] Extend the existing Mocha/Chai testing framework for CLI tests
- [ ] Utilize the existing `__tests__/cli/` directory for CLI test files
- [ ] Create file system mocks for directory and file operations
- [ ] Set up command-line argument parsing mocks
- [ ] Create test fixtures for IDE configurations
- [ ] Add helper functions for CLI output testing
- [ ] Set up a local HTTP server for URL-based preset testing
  - [ ] Create server setup/teardown utilities
  - [ ] Create mock YAML presets for the server to serve
  - [ ] Add ability to simulate different HTTP responses and errors

## Phase 1: Project Structure & CLI Framework Integration

### Test First

- [ ] Create tests in `__tests__/cli/command-parser.test.ts` for command-line parsing
- [ ] Create tests in `__tests__/cli/help-display.test.ts` for help documentation
- [ ] Create tests in `__tests__/cli/backward-compatibility.test.ts` for existing flags
- [ ] Create tests to verify command routing (init, add, remove, default server)
- [ ] Create tests for command aliases (i → add, rm/uninstall → remove)

### Then Implement

- [ ] Build CLI framework on top of existing MCP server code
- [ ] Create CLI entry point that maintains backward compatibility
- [ ] Set up command parsing using commander.js or similar
- [ ] Implement help documentation
- [ ] Ensure existing --config and --preset flags still work
- [ ] Implement command aliases for add and remove commands

## Phase 2: Default Server Command

### Test First

- [ ] Extend existing server tests to verify CLI invocation behavior
- [ ] Create tests to verify server runs with default configuration when no command
- [ ] Create tests to verify commands prevent server startup
- [ ] Create tests for backward compatibility with existing flags
- [ ] Create tests for migrating from existing usage patterns

### Then Implement

- [ ] Refactor existing server.ts to work as both standalone and CLI-invoked server
- [ ] Ensure server runs when no command is specified
- [ ] Maintain current configuration path and preset handling
- [ ] Implement migration path from existing usage patterns

## Phase 3: Init Command

### Test First

- [ ] Create tests in `__tests__/cli/init-command.test.ts` for all init functionality
- [ ] Create tests for interactive IDE selection with mocked prompts
- [ ] Create tests for directory creation and file generation
- [ ] Create tests for each IDE configuration format
- [ ] Create tests for headless mode configuration
- [ ] Create tests for handling existing configurations
- [ ] Create tests for non-interactive mode with IDE flags

### Then Implement

- [ ] Create interactive CLI prompts for IDE selection
- [ ] Implement `.mcp-workflows` directory creation
- [ ] Create `mcp-config.js` file generation
- [ ] Implement IDE-specific configuration
- [ ] Implement headless mode with `--headless` flag
  - [ ] Create mcpn directory in user's documents
  - [ ] Create .mcp-workflows in the mcpn directory
  - [ ] Set proper config paths
- [ ] Add direct IDE selection flags (--cursor, --windsurf, etc.)
- [ ] Implement detection and handling of existing configurations

## Phase 4: Add Command (Extending Existing Preset System)

### Test First

- [ ] Create tests in `__tests__/cli/add-command.test.ts` for all add functionality
- [ ] Create tests that verify integration with existing preset system
- [ ] Create tests for URL-based preset downloading with mocked HTTP responses
- [ ] Create tests for YAML validation using existing test fixtures
- [ ] Create tests for workflow name conflict detection and resolution
- [ ] Create tests for filename conflict handling
- [ ] Create tests for URL validation and security measures
- [ ] Create tests for alias support (`npx mcpn i`)
- [ ] Create tests using local HTTP server for URL preset download testing
  - [ ] Test downloading valid YAML preset files
  - [ ] Test downloading malformed YAML files
  - [ ] Test downloading non-YAML files
  - [ ] Test handling redirects
  - [ ] Test handling authentication requirements
  - [ ] Test handling network timeouts
  - [ ] Test handling server errors

### Then Implement

- [ ] Extend current preset system to support user-managed presets
- [ ] Add URL-based preset downloading
- [ ] Create YAML validation for presets
- [ ] Implement workflow name conflict detection
- [ ] Create conflict resolution UI with radio buttons
- [ ] Add filename conflict handling with automatic suffix
- [ ] Implement URL security validation and user warnings
- [ ] Implement alias support for add command
- [ ] Implement robust HTTP request handling for URL presets
  - [ ] Add support for redirects
  - [ ] Add timeout handling
  - [ ] Add proper error messages for network issues
  - [ ] Add validation of downloaded content

## Phase 5: Remove Command

### Test First

- [ ] Create tests in `__tests__/cli/remove-command.test.ts` for all remove functionality
- [ ] Create tests for workflow identification with test fixtures
- [ ] Create tests for file removal operations
- [ ] Create tests for conflict detection and resolution
- [ ] Create tests for handling various error cases
- [ ] Create tests for removing workflows from different sources
- [ ] Create tests for alias support (`npx mcpn rm` and `npx mcpn uninstall`)
- [ ] Create tests for removing URL-sourced presets with tracking metadata

### Then Implement

- [ ] Implement workflow identification and removal
- [ ] Add preset file removal capability
- [ ] Create workflow vs preset conflict detection
- [ ] Implement conflict resolution UI
- [ ] Add validation for non-existent workflows/presets
- [ ] Implement alias support for remove command
- [ ] Add tracking for URL-sourced presets to enable removal by URL

## Phase 6: Error Handling & Edge Cases

### Test First

- [ ] Create tests in `__tests__/cli/error-handling.test.ts` for error scenarios
- [ ] Create tests for missing prerequisites
- [ ] Create tests for invalid inputs
- [ ] Create tests for error message generation
- [ ] Create tests for recovery flows
- [ ] Create tests that verify backward compatibility with existing error handling
- [ ] Create tests for network failures during URL preset downloading
- [ ] Create tests for permission issues when creating/modifying files
- [ ] Create tests using local HTTP server for specific error scenarios
  - [ ] Test handling 404 responses
  - [ ] Test handling 500 server errors
  - [ ] Test handling slow responses
  - [ ] Test handling connection reset

### Then Implement

- [ ] Implement comprehensive error handling
- [ ] Create user-friendly error messages
- [ ] Implement recovery workflows
- [ ] Ensure backward compatibility with existing error paths
- [ ] Add specific handling for network and permission errors
- [ ] Implement graceful fallbacks for common failure scenarios
- [ ] Add detailed error reporting for URL-related issues

## Phase 7: Documentation & Packaging

### Test First

- [ ] Create tests for npm package functionality
- [ ] Create tests for command documentation completeness
- [ ] Create tests that verify backward compatibility in packaged version

### Then Implement

- [ ] Create comprehensive help documentation
- [ ] Finalize packaging for npm distribution
- [ ] Update README with usage instructions
- [ ] Document backward compatibility with existing usage
- [ ] Create migration guides for existing users
- [ ] Add documentation for URL-based preset functionality and security considerations

### Manual Testing Checklist

- [ ] Test Cursor integration
- [ ] Test Windsurf integration
- [ ] Test Cline integration
- [ ] Test Rootcode integration
- [ ] Test NPX installation and execution
- [ ] Verify help documentation is accurate and helpful
- [ ] Test on different operating systems (if possible)
- [ ] Verify backward compatibility with existing usage patterns
- [ ] Test with real-world workflow examples
- [ ] Test security warnings when adding URL-based presets
- [ ] Test URL-based preset downloading from various sources:
  - [ ] GitHub raw content
  - [ ] Personal websites
  - [ ] Various content types and headers

## Test Structure

Tests should follow the existing project pattern:

- Files in `__tests__/cli/` directory
- Naming convention: `feature-name.test.ts`
- Use Mocha's `describe` and `it` functions
- Use Chai for assertions
- Utilize existing test fixtures in `__tests__/test-workflows/`

### Local HTTP Server for Testing

For URL-based preset testing, we'll set up a simple Express or Node.js HTTP server:

```typescript
import { expect } from "chai";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { AddCommand } from "../src/commands/add"; // Import your implementation

describe("URL-based preset download tests", () => {
  let server: http.Server;
  const PORT = 3000;
  const BASE_URL = `http://localhost:${PORT}`;

  beforeEach(() => {
    // Start a local HTTP server for testing
    server = http.createServer((req, res) => {
      if (req.url === "/valid-preset.yaml") {
        res.writeHead(200, { "Content-Type": "text/yaml" });
        res.end(
          fs.readFileSync(path.join(__dirname, "fixtures", "valid-preset.yaml"))
        );
      } else if (req.url === "/invalid-preset.yaml") {
        res.writeHead(200, { "Content-Type": "text/yaml" });
        res.end("This is not valid YAML: :");
      } else if (req.url === "/error") {
        res.writeHead(500);
        res.end("Internal Server Error");
      } else if (req.url === "/timeout") {
        // Don't respond, simulating a timeout
      } else {
        res.writeHead(404);
        res.end("Not Found");
      }
    });

    server.listen(PORT);
  });

  afterEach(() => {
    // Shutdown the server after each test
    server.close();
  });

  it("should download and install a valid preset from URL", async () => {
    // Test the add command with a valid URL
    // ...
  });

  it("should handle invalid YAML gracefully", async () => {
    // Test with invalid YAML
    // ...
  });

  it("should handle server errors appropriately", async () => {
    // Test with server error response
    // ...
  });

  // Additional tests...
});
```

### Example Test Format

```typescript
import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
// Import the CLI functionality to test

describe("init command", () => {
  beforeEach(() => {
    // Setup test environment
    // Mock filesystem or create temporary directories
  });

  afterEach(() => {
    // Clean up test environment
    // Remove temporary files/directories
  });

  it("should create .mcp-workflows directory", () => {
    // Given: A directory without .mcp-workflows

    // When: init command is executed

    // Then: .mcp-workflows directory should be created
    expect(fs.existsSync(path.join(testDir, ".mcp-workflows"))).to.be.true;
  });

  it("should generate correct mcp-config.js", () => {
    // Given: An initialized directory

    // When: init command completes

    // Then: mcp-config.js should exist with correct content
    const configContent = fs.readFileSync(
      path.join(testDir, "mcp-config.js"),
      "utf-8"
    );
    expect(configContent).to.include("module.exports = {");
  });
});
```

## Implementation Strategy

- Start by writing failing tests for each feature using the existing Mocha/Chai framework
- Implement minimal code to pass tests
- Maintain backward compatibility with current usage
- Build on existing code rather than starting from scratch
- Refactor after tests are passing
- Regularly run the full test suite to ensure no regressions

## Definition of Done

A phase is considered complete when:

1. All tests for that phase are written and failing before implementation
2. The implementation makes all tests pass
3. Code has been reviewed
4. Documentation has been updated
5. No regressions in previous phases
6. Backward compatibility is maintained
