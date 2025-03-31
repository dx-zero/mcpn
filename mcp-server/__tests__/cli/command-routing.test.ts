import { expect } from "chai";
import { runCli } from "../../src/cli/cli";

describe("Command Routing", () => {
  it("should route to init command correctly", async () => {
    const args = ["init"];
    const result = await runCli(args, true); // Mock mode enabled

    expect(result.mode).to.equal("command");
    expect(result.command).to.equal("init");
  });

  it("should route to add command correctly", async () => {
    const args = ["add", "https://example.com/preset.yaml"];
    const result = await runCli(args, true); // Mock mode enabled

    expect(result.mode).to.equal("command");
    expect(result.command).to.equal("add");
    expect(result.args).to.deep.equal(["https://example.com/preset.yaml"]);
  });

  it("should route to remove command correctly", async () => {
    const args = ["remove", "workflow-name"];
    const result = await runCli(args, true); // Mock mode enabled

    expect(result.mode).to.equal("command");
    expect(result.command).to.equal("remove");
    expect(result.args).to.deep.equal(["workflow-name"]);
  });

  it("should route to server mode when no command is provided", async () => {
    const args = [];
    const result = await runCli(args, true); // Mock mode enabled

    expect(result.mode).to.equal("server");
  });

  it("should handle options with commands", async () => {
    const args = ["init", "--cursor", "--headless"];
    const result = await runCli(args, true); // Mock mode enabled

    expect(result.mode).to.equal("command");
    expect(result.command).to.equal("init");
    expect(result.options).to.deep.include({
      cursor: true,
      headless: true,
    });
  });

  it("should handle command alias for add (i)", async () => {
    const args = ["i", "https://example.com/preset.yaml"];
    const result = await runCli(args, true); // Mock mode enabled

    expect(result.mode).to.equal("command");
    expect(result.command).to.equal("add");
    expect(result.args).to.deep.equal(["https://example.com/preset.yaml"]);
  });

  it("should handle command alias for remove (rm)", async () => {
    const args = ["rm", "workflow-name"];
    const result = await runCli(args, true); // Mock mode enabled

    expect(result.mode).to.equal("command");
    expect(result.command).to.equal("remove");
    expect(result.args).to.deep.equal(["workflow-name"]);
  });

  it("should handle command alias for remove (uninstall)", async () => {
    const args = ["uninstall", "workflow-name"];
    const result = await runCli(args, true); // Mock mode enabled

    expect(result.mode).to.equal("command");
    expect(result.command).to.equal("remove");
    expect(result.args).to.deep.equal(["workflow-name"]);
  });
});
