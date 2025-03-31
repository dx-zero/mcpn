import { expect } from "chai";
import { parseArgs } from "../../src/cli/command-parser";
import { runCli } from "../../src/cli/cli";

describe("Backward Compatibility", () => {
  it("should handle --config flag correctly", () => {
    const args = ["--config", "path/to/config"];
    const parsed = parseArgs(args);

    expect(parsed.options.config).to.equal("path/to/config");
    expect(parsed.command).to.be.undefined;
  });

  it("should handle --preset flag correctly", () => {
    const args = ["--preset", "thinking,coding"];
    const parsed = parseArgs(args);

    expect(parsed.options.preset).to.equal("thinking,coding");
    expect(parsed.command).to.be.undefined;
  });

  it("should handle both --config and --preset flags together", () => {
    const args = ["--config", "path/to/config", "--preset", "thinking,coding"];
    const parsed = parseArgs(args);

    expect(parsed.options.config).to.equal("path/to/config");
    expect(parsed.options.preset).to.equal("thinking,coding");
    expect(parsed.command).to.be.undefined;
  });

  it("should run server mode when no command is provided", async () => {
    const args = ["--preset", "thinking"];
    const result = await runCli(args, true); // Mock mode enabled

    expect(result.mode).to.equal("server");
    expect(result.presets).to.deep.equal(["thinking"]);
  });

  it("should run server mode with config path when provided", async () => {
    const args = ["--config", "path/to/config"];
    const result = await runCli(args, true); // Mock mode enabled

    expect(result.mode).to.equal("server");
    expect(result.configPath).to.equal("path/to/config");
  });

  it("should default to thinking preset when no preset specified and no config path", async () => {
    const args = [];
    const result = await runCli(args, true); // Mock mode enabled

    expect(result.mode).to.equal("server");
    expect(result.presets).to.deep.equal(["thinking"]);
  });
});
