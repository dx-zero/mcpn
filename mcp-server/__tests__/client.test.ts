/// <reference types="mocha" />
import { expect } from "chai";
import { McpTestClient } from "../src/client.js";

describe("MCP Client Tests", function () {
  this.timeout(10000); // Increase timeout to allow for server startup
  let client: McpTestClient;

  beforeEach(() => {
    client = new McpTestClient();
  });

  afterEach(async () => {
    try {
      await client.close();
    } catch (error) {
      console.error("Error closing client:", error);
    }
  });

  it("should connect to server with default configuration", async () => {
    await client.connect();
    const tools = await client.listTools();

    // When no args provided, default preset is "thinking", so it should include generate_thought
    expect(tools.tools).to.be.an("array");
    const toolNames = tools.tools.map((t: any) => t.name);
    expect(toolNames).to.include("generate_thought");
  });

  it("should connect with specific preset", async () => {
    await client.connect(["--preset", "coding"]);
    const tools = await client.listTools();

    // Coding preset should include debugger_mode, planner_mode, etc.
    expect(tools.tools).to.be.an("array");
    const toolNames = tools.tools.map((t: any) => t.name);
    expect(toolNames).to.include("debugger_mode");
    expect(toolNames).to.include("planner_mode");
    expect(toolNames).to.include("architecture_mode");
  });

  it("should work with multiple presets", async () => {
    await client.connect(["--preset", "thinking,coding"]);
    const tools = await client.listTools();

    // Should have tools from both presets
    expect(tools.tools).to.be.an("array");
    const toolNames = tools.tools.map((t: any) => t.name);
    expect(toolNames).to.include("generate_thought"); // from thinking
    expect(toolNames).to.include("debugger_mode"); // from coding
  });
});
