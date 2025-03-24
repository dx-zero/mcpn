# Workflows MCP v0.1.0

Built by [@tedx_ai](https://x.com/tedx_ai)

Workflows MCP is a Model Context Protocol (MCP) server that allows you to orchestrate / combine many prompts + MCP servers into compound MCP prompting tools.

Think of it like a dynamic prompting library that you can easily share and version control through yaml files that also lets your define how to best use many MCP tools across many MCP servers for specific tasks.

## High Level Overview

The key to effective MCP use is to know when/how to use the right tools. Workflows MCP helps make this process 10x easier + faster 🚀

With Workflows MCP, you can:

✅ Combine prompts with MCP servers into reusable & easy to edit/share/organize workflows

✅ Trigger workflows with custom commands like: "enter debugger mode" or "use thinking mode"

✅ Define custom strategies for how to use many tools in a workflow (sequential or situational/dynamic)

✅ Easily onboard your team to the best prompts + ways to use many MCP tools w/ version control.

We also provide a number of useful presets to get you started 🫡

All in all, this should make it MUCH easier to rally your team around when/how to use the best prompts and MCP tools for specific tasks 🦾

## Features

### 📝 Custom Configuration

- Load custom configs from multiple YAML files in a `.workflows` or `.mcp-workflows` directory
- Easily save these yaml files to a git repo and share with your team
- Since MCP servers can have custom configs for each project, you can easily pick and choose which configs to use for each project - setting up custom workflow folders for each project
- Support for typed parameter inputs in tool configurations makes building custom MCP prompting tools a breeze

### 🚀 Ready-to-Use Presets

Workflows MCP includes multiple preset workflow modes out of the box for thinking, coding, and github use:

**Thinking**: General purpose tools to improve reasoning on any task

- **Thinking Mode**: Reflect on thoughts and produce structured analysis (inspired by Anthropic's latest research into thinking tools)
- **Deep Thinking Mode**: Comprehensive multi-perspective analysis with detailed reflections

**Coding**: Universally applicable tools for common coding tasks
Universally applicable tools for common coding tasks

- **Debugger Mode**: Systematic multi-step reasoning and debugging with hypothesis creation, telemetry gathering and testing
- **Architecture Mode**: System design prompt with tradeoff analysis and implementation planning
- **Planner Mode**: Systematic code change planning with codebase analysis
- **PRD Mode**: Structured product requirements documentation for features, user stories and spike analysis
- **Save Note**: Document ongoing work with comprehensive progress tracking. Useful for when you need to step away for a bit and want to save your thoughts for later.

**GitHub**: Tools to simplify common GitHub tasks. Great for anyone who is a beginner with source control using Git and the Github CLI

- **PR Review Mode**: Comprehensive pull request analysis with security considerations
- **PR Creation Mode**: Structured PR creation process using GitHub CLI
- **Create Branch**: Smart branch creation with contextual naming
- **Save Changes**: Systematic git commit and push workflow

## Installation

Install the MCP server into an MCP client using the following command or JSON:

```bash
npx @agentdesk/workflows-mcp@latest
```

If using JSON in Cursor to setup your MCP server, you can use the following config:

```json
{
  "mcpServers": {
    "workflows-mcp": {
      "command": "npx",
      "args": ["-y", "@agentdesk/workflows-mcp@latest"]
    }
  }
}
```

To provide custom configurations, you can use the `--config` flag to point to a directory containing YAML configuration files. The directory must be named `.workflows` or `.mcp-workflows` as so:

```bash
npx @agentdesk/workflows-mcp@latest --config /path/to/.workflows
```

If you want to enable presets, you can use the `--preset` flag to specify which presets to load:

```bash
npx @agentdesk/workflows-mcp@latest --preset thinking,coding,github
```

Here's what this would look like in a Cursor config all combined:

```json
{
  "mcpServers": {
    "workflows-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@agentdesk/workflows-mcp@lates --config /path/to/.workflows --preset thinking,coding,github"
      ]
    }
  }
}
```

Note:

- _If you update your config, you must refresh the MCP tool_
- _If refreshing doesn't work, make sure your config is valid YAML_
- _If you're still having issues, then try removing & renaming the MCP tool in your client_
- _If no config or preset is provided, it will default to using the `thinking` preset._
- _If you're still not able to get this working, open an issue ticket_

## Custom Workflow Configs

Create a `.workflows` or `.mcp-workflows` directory in your project and add YAML configuration files with any name (must end with `.yaml` or `.yml`). These configurations will also override the preset defaults if named the same as a preset tool.

### Example Configuration Files

#### override-default.yaml

```yaml
# Override a preset tool
debugger_mode:
  description: "Custom debugging tool"
  context: "This is a user-defined override."

# Add a completely new tool
custom_tool:
  description: "Custom user-defined tool"
  prompt: "# Custom Tool\n\nThis is a completely custom tool."
```

#### parameterized-tools.yaml

```yaml
# Create a tool with typed parameters
search_tool:
  name: "search"
  description: "Search for information"
  parameters:
    query:
      type: "string"
      description: "The search query"
      required: true
    limit:
      type: "number"
      description: "Maximum number of results"
      default: 10
    includeArchived:
      type: "boolean"
      description: "Whether to include archived items"
      default: false
    filterType:
      type: "enum"
      enum: ["all", "recent", "popular"]
      description: "Type of filter to apply"
      default: "all"
  prompt: |
    This is a search tool that allows searching for information.

    When a user asks for information, use this tool with their query to find relevant results.
    Make sure to use appropriate filters based on the context of their request.
```

## Configuration Structure

Each YAML file should contain a mapping of tool names to their configuration. Configurations can be loaded from two sources:

1. Internal presets (located in the `presets` directory)
2. User-defined configurations (in `.workflows` or `.mcp-workflows` directory)

### Basic Tool Configuration

For each tool, you can specify:

- `name`: Optional name override for the registered tool (default is the config key)
- `description`: Description of what the workflow/tool does
- `prompt`: Custom prompt (completely replaces default prompt if workflow name is also an active preset)
- `context`: Additional context to append to the prompt (does not replace default prompt for presets)
- `tools`: Array of tools available in this mode, each with `name`, `description` and optional `parameters`
- `toolMode`: Mode of tool execution, either "sequential" or "situational" (defaults to "situational")
- `parameters`: Object mapping of parameters as input to the tool (improves reasoning)
- `disabled`: Boolean to disable the tool

### Tool Configuration Examples

#### Sequential Tool Configuration

In sequential mode, tools are executed in a specific order:

```yaml
workflow_mode:
  description: "Custom workflow with sequential steps"
  prompt: "Enter your prompt here..."
  toolMode: "sequential"

  # sequence is based on the order of the tools below
  tools:
    - name: "step_one_console_logs"
      description: "First, gather console logs"
    - name: "step_two_console_errors"
      description: "Then, gather console errors"
    - name: "step_three_network_logs"
      description: "Finally, gather all network logs"
```

#### Situational Tool Configuration

In situational mode (default), tools can be used as needed based on context:

```yaml
workflow_mode:
  description: "Custom workflow with dynamic tool usage"
  prompt: |
    Enter your multi-line
    prompt here like this
  toolMode: "situational" # can be omitted as it's the default
  tools:
    - name: "analyze"
      description: "Analyze code or data"
    - name: "generate"
      description: "Generate new content"
    - name: "validate"
      description: "Validate changes or output"
```

### Input Parameter Configuration

Tools can accept typed parameters that an MCP Client / agent can provide to improve reasoning capabilities for your prompt/workflow. These inputs are automatically converted to Zod schemas for validation and type safety. Each parameter is defined with the following properties:

| Property      | Description                                                            | Required                 |
| ------------- | ---------------------------------------------------------------------- | ------------------------ |
| `type`        | Data type: "string", "number", "boolean", "array", "object", or "enum" | Yes                      |
| `description` | Human-readable description of the parameter                            | No                       |
| `required`    | Whether the parameter is required                                      | No (defaults to `false`) |
| `default`     | Default value if not provided                                          | No                       |
| `enum`        | Array of valid values (required for `enum` type only)                  | Yes (for `enum` type)    |
| `items`       | For array types, defines the type of items in the array                | No                       |
| `properties`  | For object types, defines the properties of the object                 | No                       |

#### Example Input Parameter Types

```yaml
# String parameter
name:
  type: "string"
  description: "User's name"
  required: true

# Number parameter with default
limit:
  type: "number"
  description: "Maximum items to return"
  default: 10

# Boolean parameter with default
includeArchived:
  type: "boolean"
  description: "Include archived items"
  default: false

# Enum parameter with predefined options
sortOrder:
  type: "enum"
  enum: ["asc", "desc"]
  description: "Sort direction"
  default: "asc"

# Array parameter with item type
tags:
  type: "array"
  description: "List of tags to filter by"
  items:
    type: "string"
    description: "A tag value"

# Object parameter with nested properties
filters:
  type: "object"
  description: "Complex filter object"
  properties:
    status:
      type: "enum"
      enum: ["active", "inactive", "pending"]
      description: "Status filter"
    dateRange:
      type: "object"
      properties:
        start:
          type: "string"
          description: "Start date"
        end:
          type: "string"
          description: "End date"
```

### Configuration Loading

The system loads configurations in the following order:

1. Internal presets from the `presets` directory
2. User-defined configurations from `.workflows` or `.mcp-workflows` directory
3. Merges configurations, with user-defined settings taking precedence

When merging configurations:

- Tool arrays are concatenated rather than replaced
- Other properties are overridden by the user-defined configuration
- Parameters are merged with user-defined parameters taking precedence

## How It Works

Workflows MCP operates through a sophisticated configuration and tool registration system:

1. **Configuration Loading and Merging**

   - Loads preset configurations from internal YAML files in the `presets` directory
   - Optionally loads user-defined configurations from `.workflows` or `.mcp-workflows` directories
   - Merges configurations with user configs taking precedence over presets
   - Supports both sequential and situational tool execution modes

2. **Tool Registration and Validation**

   - Each tool is dynamically registered with the MCP server based on the merged configuration
   - Tools can be customized with:
     - Custom names and descriptions
     - Typed parameters with validation
     - Custom prompts or extensions of preset prompts
     - Sequential or situational execution strategies
   - Validates tool configurations and parameters at registration time

3. **Parameter Handling**

   - Parameters are defined using a type-safe configuration system
   - Supports multiple parameter types: string, number, boolean, array, object, and enum
   - Automatically converts parameter definitions to Zod schemas for runtime validation
   - Provides automatic validation of parameter values during tool execution

4. **Prompt Management**

   - Manages prompts through a flexible system that supports:
     - Default prompts from presets
     - Custom user-defined prompts
     - Additional context injection
     - Dynamic tool availability based on mode
   - Supports both static and dynamic prompt generation based on configuration

5. **Error Handling and Debugging**
   - Comprehensive error handling during configuration loading and tool execution
   - Detailed logging for debugging and troubleshooting
   - Graceful fallbacks when configurations or tools are missing
   - Runtime validation of tool inputs and configurations

This architecture allows for powerful, type-safe interactions between tools and clients while maintaining flexibility through configuration-driven customization.

## License

MIT
