# DevTools MCP Server

A Model Context Protocol (MCP) server that provides specialized tools for software development workflows.

## Features

- Multiple specialized modes for different development tasks
- Customizable prompts and tool configurations
- Support for YAML, JSON, and JavaScript configuration formats

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd devtools-mcp/mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

Run the server with a configuration file:

```bash
# Using YAML config (recommended)
node dist/server.js --config ../config.yaml

# Using JSON config
node dist/server.js --config ../config.json

# Using JavaScript config
node dist/server.js --config ../config.js
```

The server uses standard input/output for communication, making it compatible with MCP clients that support stdio transport.

## Configuration

The server supports three configuration formats:

- YAML (recommended): Cleaner syntax, better for multiline strings
- JSON: Standard format, good for interoperability
- JavaScript: Backwards compatibility with existing configurations

See the root [README.md](../README.md) for detailed configuration options and examples.

## Development

For development with automatic rebuilding:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Requirements

- Node.js 16+
- TypeScript 5+

## License

MIT
