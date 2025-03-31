import { expect } from "chai";
import { parseArgs } from "../../src/cli/command-parser";

describe("Command Parser", () => {
  it("should parse command and options correctly", () => {
    const args = ["init", "--cursor", "--headless"];
    const parsed = parseArgs(args);

    expect(parsed.command).to.equal("init");
    expect(parsed.options).to.deep.include({ cursor: true, headless: true });
  });

  it("should handle command with values", () => {
    const args = ["add", "https://example.com/preset.yaml", "--force"];
    const parsed = parseArgs(args);

    expect(parsed.command).to.equal("add");
    expect(parsed.values).to.deep.equal(["https://example.com/preset.yaml"]);
    expect(parsed.options).to.deep.include({ force: true });
  });

  it("should handle options with values", () => {
    const args = ["init", "--config", "custom-config.js"];
    const parsed = parseArgs(args);

    expect(parsed.command).to.equal("init");
    expect(parsed.options).to.deep.include({ config: "custom-config.js" });
  });

  it("should handle backward compatible flags", () => {
    const args = ["--config", "path/to/config", "--preset", "thinking,coding"];
    const parsed = parseArgs(args);

    expect(parsed.command).to.be.undefined;
    expect(parsed.options.config).to.equal("path/to/config");
    expect(parsed.options.preset).to.equal("thinking,coding");
  });

  it("should recognize command aliases", () => {
    const args = ["i", "https://example.com/preset.yaml"];
    const parsed = parseArgs(args);

    expect(parsed.command).to.equal("add");
    expect(parsed.values).to.deep.equal(["https://example.com/preset.yaml"]);
  });

  it("should recognize remove command aliases", () => {
    const args = ["rm", "workflow-name"];
    const parsed = parseArgs(args);

    expect(parsed.command).to.equal("remove");
    expect(parsed.values).to.deep.equal(["workflow-name"]);
  });

  it("should handle the uninstall alias for remove", () => {
    const args = ["uninstall", "workflow-name"];
    const parsed = parseArgs(args);

    expect(parsed.command).to.equal("remove");
    expect(parsed.values).to.deep.equal(["workflow-name"]);
  });
});
