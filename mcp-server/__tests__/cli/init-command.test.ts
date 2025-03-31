import { expect } from "chai";
import * as sinon from "sinon";
import { initCommand } from "../../src/cli/commands/init";

describe("Init Command", () => {
  // Setup and teardown
  let sandbox: sinon.SinonSandbox;
  let fs: any;
  let path: any;
  let console: any;
  let promptForIde: sinon.SinonStub;

  beforeEach(() => {
    // Create sandbox
    sandbox = sinon.createSandbox();

    // Create mock dependencies
    fs = {
      existsSync: sandbox.stub(),
      mkdirSync: sandbox.stub(),
      writeFileSync: sandbox.stub(),
    };

    path = {
      join: sandbox.stub().callsFake((...args) => args.join("/")),
    };

    console = {
      log: sandbox.stub(),
      error: sandbox.stub(),
    };

    // Mock the promptForIde function to return "cursor" by default
    promptForIde = sandbox.stub().resolves("cursor");
  });

  afterEach(() => {
    // Restore all stubs
    sandbox.restore();
  });

  it("should create .mcp-workflows directory when it doesn't exist", async () => {
    // Setup
    const options = {};
    const workflowsPath = "cwd/.mcp-workflows";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    fs.existsSync.withArgs(workflowsPath).returns(false);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(fs.mkdirSync.calledOnceWith(workflowsPath, { recursive: true })).to
      .be.true;
    expect(console.log.calledWith(sinon.match(/created/i))).to.be.true;
  });

  it("should not create .mcp-workflows directory when it already exists", async () => {
    // Setup
    const options = {};
    const workflowsPath = "cwd/.mcp-workflows";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    fs.existsSync.withArgs(workflowsPath).returns(true);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(fs.mkdirSync.called).to.be.false;
    expect(console.log.calledWith(sinon.match(/already exists/i))).to.be.true;
  });

  it("should create mcp-config.js file with default settings", async () => {
    // Setup
    const options = {};
    const workflowsPath = "cwd/.mcp-workflows";
    const configPath = "cwd/.mcp-workflows/mcp-config.js";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    path.join.withArgs(workflowsPath, "mcp-config.js").returns(configPath);
    fs.existsSync.withArgs(workflowsPath).returns(true);
    fs.existsSync.withArgs(configPath).returns(false);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(
      fs.writeFileSync.calledWith(
        configPath,
        sinon.match(/module\.exports/),
        "utf-8"
      )
    ).to.be.true;
  });

  it("should not overwrite existing mcp-config.js file", async () => {
    // Setup
    const options = {};
    const workflowsPath = "cwd/.mcp-workflows";
    const configPath = "cwd/.mcp-workflows/mcp-config.js";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    path.join.withArgs(workflowsPath, "mcp-config.js").returns(configPath);
    fs.existsSync.withArgs(workflowsPath).returns(true);
    fs.existsSync.withArgs(configPath).returns(true);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(fs.writeFileSync.called).to.be.false;
    expect(console.log.calledWith(sinon.match(/already exists/i))).to.be.true;
  });

  it("should prompt for IDE selection in interactive mode", async () => {
    // Setup
    const options = {};
    const workflowsPath = "cwd/.mcp-workflows";
    const configPath = "cwd/.mcp-workflows/mcp-config.js";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    path.join.withArgs(workflowsPath, "mcp-config.js").returns(configPath);
    fs.existsSync.withArgs(workflowsPath).returns(true);
    fs.existsSync.withArgs(configPath).returns(false);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(promptForIde.calledOnce).to.be.true;
    expect(
      fs.writeFileSync.calledWith(
        configPath,
        sinon.match(/ide: 'cursor'/),
        "utf-8"
      )
    ).to.be.true;
  });

  it("should create IDE-specific configuration with --cursor flag", async () => {
    // Setup
    const options = { cursor: true };
    const workflowsPath = "cwd/.mcp-workflows";
    const configPath = "cwd/.mcp-workflows/mcp-config.js";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    path.join.withArgs(workflowsPath, "mcp-config.js").returns(configPath);
    fs.existsSync.withArgs(workflowsPath).returns(true);
    fs.existsSync.withArgs(configPath).returns(false);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(promptForIde.called).to.be.false;
    expect(
      fs.writeFileSync.calledWith(
        configPath,
        sinon.match(/ide: 'cursor'/),
        "utf-8"
      )
    ).to.be.true;
  });

  it("should create IDE-specific configuration with --windsurf flag", async () => {
    // Setup
    const options = { windsurf: true };
    const workflowsPath = "cwd/.mcp-workflows";
    const configPath = "cwd/.mcp-workflows/mcp-config.js";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    path.join.withArgs(workflowsPath, "mcp-config.js").returns(configPath);
    fs.existsSync.withArgs(workflowsPath).returns(true);
    fs.existsSync.withArgs(configPath).returns(false);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(
      fs.writeFileSync.calledWith(
        configPath,
        sinon.match(/ide: 'windsurf'/),
        "utf-8"
      )
    ).to.be.true;
  });

  it("should create IDE-specific configuration with --cline flag", async () => {
    // Setup
    const options = { cline: true };
    const workflowsPath = "cwd/.mcp-workflows";
    const configPath = "cwd/.mcp-workflows/mcp-config.js";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    path.join.withArgs(workflowsPath, "mcp-config.js").returns(configPath);
    fs.existsSync.withArgs(workflowsPath).returns(true);
    fs.existsSync.withArgs(configPath).returns(false);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(
      fs.writeFileSync.calledWith(
        configPath,
        sinon.match(/ide: 'cline'/),
        "utf-8"
      )
    ).to.be.true;
  });

  it("should create IDE-specific configuration with --rootcode flag", async () => {
    // Setup
    const options = { rootcode: true };
    const workflowsPath = "cwd/.mcp-workflows";
    const configPath = "cwd/.mcp-workflows/mcp-config.js";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    path.join.withArgs(workflowsPath, "mcp-config.js").returns(configPath);
    fs.existsSync.withArgs(workflowsPath).returns(true);
    fs.existsSync.withArgs(configPath).returns(false);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(
      fs.writeFileSync.calledWith(
        configPath,
        sinon.match(/ide: 'rootcode'/),
        "utf-8"
      )
    ).to.be.true;
  });

  it("should set up headless mode with --headless flag", async () => {
    // Setup
    const options = { headless: true };
    const workflowsPath = "cwd/.mcp-workflows";
    const configPath = "cwd/.mcp-workflows/mcp-config.js";
    const documentsDir = "home/Documents";
    const mcpnDir = "home/Documents/mcpn";
    const headlessWorkflowsDir = "home/Documents/mcpn/.mcp-workflows";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    path.join.withArgs(workflowsPath, "mcp-config.js").returns(configPath);
    path.join.withArgs(sinon.match.any, "Documents").returns(documentsDir);
    path.join.withArgs(documentsDir, "mcpn").returns(mcpnDir);
    path.join.withArgs(mcpnDir, ".mcp-workflows").returns(headlessWorkflowsDir);

    fs.existsSync.withArgs(workflowsPath).returns(true);
    fs.existsSync.withArgs(configPath).returns(false);
    fs.existsSync.withArgs(mcpnDir).returns(false);
    fs.existsSync.withArgs(headlessWorkflowsDir).returns(false);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(fs.mkdirSync.calledWith(mcpnDir, { recursive: true })).to.be.true;
    expect(fs.mkdirSync.calledWith(headlessWorkflowsDir, { recursive: true }))
      .to.be.true;
    expect(
      fs.writeFileSync.calledWith(
        configPath,
        sinon.match(/headless:\s*true/i),
        "utf-8"
      )
    ).to.be.true;
  });

  it("should handle combined IDE and headless flags", async () => {
    // Setup
    const options = { cursor: true, headless: true };
    const workflowsPath = "cwd/.mcp-workflows";
    const configPath = "cwd/.mcp-workflows/mcp-config.js";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    path.join.withArgs(workflowsPath, "mcp-config.js").returns(configPath);
    fs.existsSync.withArgs(workflowsPath).returns(true);
    fs.existsSync.withArgs(configPath).returns(false);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(
      fs.writeFileSync.calledWith(
        configPath,
        sinon.match(/ide: 'cursor'.*headless:\s*true/is),
        "utf-8"
      )
    ).to.be.true;
  });

  it("should prioritize IDE flag over interactive selection", async () => {
    // Setup
    const options = { windsurf: true };
    const workflowsPath = "cwd/.mcp-workflows";
    const configPath = "cwd/.mcp-workflows/mcp-config.js";

    path.join.withArgs(process.cwd(), ".mcp-workflows").returns(workflowsPath);
    path.join.withArgs(workflowsPath, "mcp-config.js").returns(configPath);
    fs.existsSync.withArgs(workflowsPath).returns(true);
    fs.existsSync.withArgs(configPath).returns(false);

    // Setup prompt to throw if called when it shouldn't be
    promptForIde.throws(
      new Error("Should not prompt for IDE when flag is provided")
    );

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(promptForIde.called).to.be.false;
    expect(
      fs.writeFileSync.calledWith(
        configPath,
        sinon.match(/ide: 'windsurf'/),
        "utf-8"
      )
    ).to.be.true;
  });

  it("should handle errors gracefully", async () => {
    // Setup
    const options = {};
    const error = new Error("Test error");

    fs.existsSync.throws(error);

    // Execute
    await initCommand(options, { fs, path, console, promptForIde });

    // Verify
    expect(console.error.calledWith(sinon.match(/error/i))).to.be.true;
  });
});
