# Phase 4: Add Command Technical Specification

## Overview

This document outlines the technical specifications for implementing the `add` command in the MCPN CLI. The command will allow users to add workflow presets either from built-in presets via aliases or from remote URLs.

## Command Interface

```bash
# Add a preset using an alias to a built-in preset
npx mcpn add thinking

# Add a preset from a URL
npx mcpn add https://example.com/my-preset.yaml

# Add a preset with the alias command
npx mcpn i thinking

# Force overwrite if conflicts exist
npx mcpn add thinking --force
```

Note: the `i` command is an alias for the `add` command.

## File Structure

```
user-project/
├── .mcp-workflows/
│   ├── metadata.json      # Tracks all installed presets and their sources
│   ├── thinking.yaml      # Directly stored presets (no nested directories)
│   ├── coding.yaml
│   └── custom-preset.yaml # Downloaded from URL
└── ...
```

## Metadata Format

The metadata file (`workflows.json`) will track the source and installation details of each preset:

```json
{
  "presets": {
    "thinking.yaml": {
      "source": "built-in",
      "alias": "thinking",
      "installedAt": "2023-04-01T12:00:00Z",
      "updatedAt": "2023-04-01T12:00:00Z"
    },
    "custom-preset.yaml": {
      "source": "url",
      "url": "https://example.com/my-preset.yaml",
      "installedAt": "2023-04-01T12:30:00Z",
      "updatedAt": "2023-04-01T12:30:00Z"
    }
  }
}
```

## Implementation Specifications

### 1. Command Handling

The `add` command will accept either an alias name or a URL as its required parameter, with an optional `--force` flag.

```typescript
export async function addCommand(
  sourceRef: string, // Alias or URL
  options: { force?: boolean } = {},
  dependencies = {
    /* injected dependencies */
  }
): Promise<void> {
  // Implementation
}
```

### 2. Source Resolution

1. **Alias Resolution**:

   - If the input is not a URL, treat it as an alias to a built-in preset
   - Look for the alias in the `@presets` directory of the CLI repo
   - Supported built-in presets: "thinking", "coding", "github", "examples"

2. **URL Resolution**:
   - If the input starts with "http://" or "https://", treat it as a URL
   - Validate the URL format and security
   - Support standard HTTP/HTTPS protocols only

### 3. Content Retrieval

1. **Alias-Based Retrieval**:

   - Copy the corresponding YAML file from the built-in presets directory
   - No network requests needed

2. **URL-Based Retrieval**:
   - Fetch the content from the specified URL
   - Implement proper HTTP request handling (timeouts, redirects, errors)
   - Verify content type is YAML-compatible
   - Maximum file size limit: 500KB

### 4. YAML Validation

All presets (both alias and URL-based) must be validated:

1. **Format Validation**:

   - Valid YAML syntax
   - Follows MCP preset schema

2. **Schema Requirements**:
   - Must contain workflow definitions
   - Each workflow must have required fields (name, description, tools)
   - Tool specifications must be valid

### 5. Filename Generation

1. **Alias-Based Filenames**:

   - Use the alias name directly (e.g., "thinking.yaml")

2. **URL-Based Filenames**:

   - Extract the filename portion from the URL
   - Sanitize to ensure valid filesystem characters
   - If extraction fails, use a hash or generic name

3. **Conflict Resolution**:
   - Check if filename already exists in `.mcp-workflows/`
   - If `--force` is provided, overwrite existing file
   - Otherwise, prompt user for resolution (overwrite, rename, cancel)
   - Use `@inquirer/prompts` for consistent UI
   - For automatic renaming, append "-1", "-2", etc.

### 6. Workflow Name Conflict Detection

1. Check for conflicts between workflow names in the new preset and existing presets
2. If conflicts exist and `--force` is provided, new workflows override existing ones
3. Otherwise, prompt user for resolution (options: keep both, keep existing, use new)

### 7. Metadata Tracking

1. **Create or Update Metadata**:

   - If metadata.json doesn't exist, create it
   - Add or update entry for the new preset
   - Include source info, installation timestamp, and update timestamp

2. **Metadata Format**:
   - Use JSON for easy parsing and updating
   - Include comprehensive details for future management

### 8. Error Handling

1. **Validation Errors**:

   - Clear error messages for invalid YAML
   - Schema validation error details

2. **Network Errors**:

   - Timeouts (with configurable limit)
   - HTTP status code handling
   - Connection failures

3. **Filesystem Errors**:

   - Permission issues
   - Disk space constraints

4. **User Communication**:
   - All errors should include:
     - What happened
     - Why it happened
     - How to fix it

### 9. Interactive UI

For conflict resolution and confirmations:

1. Use `@inquirer/prompts` for consistency with other commands
2. Provide clear options with explanations
3. Support terminal fallback for non-interactive environments

## Security Considerations

### 1. URL Validation

- Restrict to HTTP/HTTPS protocols
- Implement domain validation (optional whitelist)
- Show security warnings for untrusted sources
- Should be valid yaml file that adheres to the MCP preset schema (we may need to add a schema validator for this)

### 2. Content Validation

- Scan for potentially malicious content patterns
- Enforce size limits to prevent DoS
- Validate against known good schema

### 3. User Confirmation

- Require explicit confirmation for downloading from non-verified sources
- Display source URL clearly before installation

## Implementation Dependencies

1. **HTTP Requests**:

   - Use native `fetch` for modern Node.js versions
   - Fallback to `node-fetch` for compatibility if needed

2. **YAML Processing**:

   - Leverage existing YAML handling in the codebase
   - Ensure consistent validation

3. **Filesystem Operations**:

   - Node.js `fs` module for file operations
   - Handle proper error cases

4. **Interactive UI**:
   - `@inquirer/prompts` for user interaction
   - Support non-interactive mode for CI/CD environments

## Testing Strategy

### 1. Test Categories

- **Alias Resolution**: Verify built-in preset aliases work correctly
- **URL Handling**: Test various URL formats and error cases
- **YAML Validation**: Verify valid and invalid YAML handling
- **Conflict Resolution**: Test filename and workflow name conflicts
- **Metadata Management**: Verify metadata is correctly created and updated
- **Integration Tests**: End-to-end command execution

### 2. HTTP Mocking

Create a mock HTTP server for testing URL-based presets:

```typescript
class MockHttpServer {
  // Configure mock responses for different URL patterns
  // Start/stop for test setup and teardown
}
```

### 3. Filesystem Mocking

Mock filesystem operations to verify file creation and updates:

```typescript
const mockFs = {
  writeFileSync: sinon.stub(),
  readFileSync: sinon.stub().returns("{}"),
  existsSync: sinon.stub().returns(false),
};
```

### 4. Integration Testing

Test the command integration with the actual CLI parser:

```typescript
// Test that CLI properly routes to the addCommand
// Verify alias command (i) works correctly
```

## Backward Compatibility

1. Ensure existing CLI functionality continues to work
2. Maintain compatibility with current preset format
3. Preserve presets loaded via existing mechanisms

## Success Criteria

The implementation will be considered successful when:

1. Users can add presets via both aliases and URLs
2. Metadata tracking works correctly
3. Conflicts are properly detected and resolved
4. Error handling is comprehensive and user-friendly
5. All tests pass consistently
6. The implementation follows the existing CLI architecture and patterns

## Implementation Timeline

1. **Research & Setup** (1 day):

   - Analyze existing preset handling
   - Set up test infrastructure

2. **Core Implementation** (2 days):

   - Implement alias resolution
   - Add URL handling
   - Create YAML validation

3. **Conflict Resolution & Metadata** (1 day):

   - Implement conflict detection and resolution
   - Add metadata tracking

4. **Integration & Testing** (1 day):

   - Connect to CLI framework
   - Complete test coverage

5. **Documentation & Refinement** (1 day):
   - Add comprehensive documentation
   - Polish error messages and UX
