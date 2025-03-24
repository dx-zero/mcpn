import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
// import { spawn, ChildProcessWithoutNullStreams } from "child_process";

export class McpTestClient {
  private client: Client;
  private transport: StdioClientTransport;
  // private serverProcess: ChildProcessWithoutNullStreams | null = null;

  constructor() {
    this.transport = new StdioClientTransport({
      command: "node",
      args: ["dist/server.js"],
    });

    this.client = new Client(
      {
        name: "devtools-mcp-test-client",
        version: "0.1.0",
      },
      {
        capabilities: {
          prompts: {},
          resources: {},
          tools: {
            list: {},
            call: {},
          },
        },
      }
    );
  }

  /**
   * Start the MCP server with the given command line arguments
   * @param args Additional arguments to pass to the server
   */
  async connect(args: string[] = []): Promise<void> {
    // Create a new transport with the specified args
    this.transport = new StdioClientTransport({
      command: "node",
      args: ["dist/server.js", ...args],
    });

    // Connect the client to the transport
    await this.client.connect(this.transport);
    console.log("Connected to MCP server");
  }

  /**
   * Close the connection to the server
   */
  async close(): Promise<void> {
    await this.transport.close();
    console.log("Disconnected from MCP server");
  }

  /**
   * List all available tools
   */
  async listTools(): Promise<any> {
    return await this.client.listTools();
  }

  /**
   * Call a tool by name with the given arguments
   * @param name Tool name
   * @param args Tool arguments
   */
  async callTool(name: string, args: any = {}): Promise<any> {
    return await this.client.callTool({
      name,
      arguments: args,
    });
  }
}
