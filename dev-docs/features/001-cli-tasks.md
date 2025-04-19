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

- [x] Extend the existing Mocha/Chai testing framework for CLI tests
- [x] Utilize the existing `test/cli/` directory for CLI test files
- [x] Create file system mocks for directory and file operations
- [x] Set up command-line argument parsing mocks
- [x] Create test fixtures for IDE configurations
- [x] Add helper functions for CLI output testing
- [ ] Set up a local HTTP server for URL-based preset testing
  - [ ] Create server setup/teardown utilities
  - [ ] Create mock YAML presets for the server to serve
  - [ ] Add ability to simulate different HTTP responses and errors

## Phase 1: Project Structure & CLI Framework Integration

### Test First

- [x] Create tests in `test/cli/command-parser.test.ts` for command-line parsing
- [x] Create tests in `test/cli/help-display.test.ts` for help documentation
- [x] Create tests in `test/cli/backward-compatibility.test.ts` for existing flags
- [x] Create tests to verify command routing (init, add, remove, default server)
- [x] Create tests for command aliases (i → add, rm/uninstall → remove)

### Then Implement

- [x] Build CLI framework on top of existing MCP server code
- [x] Create CLI entry point that maintains backward compatibility
- [x] Set up command parsing using commander.js or similar
- [x] Implement help documentation
- [x] Ensure existing --config and --preset flags still work
- [x] Implement command aliases for add and remove commands

## Phase 2: Default Server Command

### Test First

- [x] Extend existing server tests to verify CLI invocation behavior
- [x] Create tests to verify server runs with default configuration when no command
- [x] Create tests to verify commands prevent server startup
- [x] Create tests for backward compatibility with existing flags
- [x] Create tests for migrating from existing usage patterns
- [x] Use the McpTestClient from client.ts for testing instead of sinon mocks

### Then Implement

- [x] Refactor existing server.ts to work as both standalone and CLI-invoked server
- [x] Ensure server runs when no command is specified
- [x] Maintain current configuration path and preset handling
- [x] Implement migration path from existing usage patterns

## Phase 3: Init Command

### Test First

- [x] Create tests in `test/cli/init-command.test.ts` for all init functionality
- [x] Create tests for interactive IDE selection with mocked prompts
- [x] Create tests for directory creation and file generation
- [x] Create tests for each IDE configuration format
- [x] Create tests for headless mode configuration
- [x] Create tests for handling existing configurations
- [x] Create tests for non-interactive mode with IDE flags

### Then Implement

- [x] Create interactive CLI prompts for IDE selection
- [x] Implement `.mcp-workflows` directory creation
- [x] Create `mcp-config.js` file generation
- [x] Implement IDE-specific configuration
- [x] Implement headless mode with `--headless` flag
  - [x] Create mcpn directory in user's documents
  - [x] Create .mcp-workflows in the mcpn directory
  - [x] Set proper config paths
- [x] Add direct IDE selection flags (--cursor, --windsurf, etc.)
- [x] Implement detection and handling of existing configurations

### Additional Completed Tasks

- [x] Simplify configuration format to only include the necessary IDE name
- [x] Place configuration file inside the `.mcp-workflows` directory
- [x] Replace readline-based prompting with modern `@inquirer/prompts` select interface
- [x] Add dependency injection for better testability
- [x] Install and integrate necessary type definitions for tests
- [x] Implement robust error handling for all operations

## Phase 4: Add Command (Extending Existing Preset System)

### Test First

- [ ] Create tests in `test/cli/add-command.test.ts` for all add functionality
- [ ] Create tests for alias resolution to built-in presets
- [ ] Create tests for URL validation and security checks
- [ ] Create tests for HTTP request handling with mock server
- [ ] Create tests for YAML syntax and schema validation
- [ ] Create tests for filename generation and conflict resolution
- [ ] Create tests for workflow name conflict detection
- [ ] Create tests for the `--force` flag behavior
- [ ] Create tests for interactive conflict resolution using mocked prompts
- [ ] Create tests for alias support (`npx mcpn i`)
- [ ] Create integration tests with the CLI command routing

### Then Implement

- [ ] Create the add command structure with dependency injection
- [ ] Implement alias resolution for built-in presets
- [ ] Add URL validation with security checks
- [ ] Create HTTP request handling for URL-based presets
- [ ] Implement YAML validation for preset schema conformance
- [ ] Add filename generation with sanitization
- [ ] Implement file conflict detection and resolution
- [ ] Add workflow name conflict detection and resolution
- [ ] Create metadata.json tracking system
- [ ] Implement force flag for automatic conflict resolution
- [ ] Add interactive conflict resolution UI with @inquirer/prompts
- [ ] Implement error handling with user-friendly messages
- [ ] Connect command to CLI framework and alias support

## Phase 5: Remove Command

### Test First

- [ ] Create tests in `test/cli/remove-command.test.ts` for all remove functionality
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

- [ ] Create tests in `test/cli/error-handling.test.ts` for error scenarios
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

- Files in `test/cli/` directory
- Naming convention: `feature-name.test.ts`
- Use Mocha's `describe` and `it` functions
- Use Chai for assertions
- Utilize existing test fixtures in `test/test-workflows/`

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

### Completion Status

- Phase 1: Project Structure & CLI Framework Integration - ✓ COMPLETE
- Phase 2: Default Server Command - ✓ COMPLETE
- Phase 3: Init Command - ✓ COMPLETE
