import { expect } from "chai";
import { generateCommandHelp, generateHelp } from "../../src/cli/help-display";

describe("Help Display", () => {
	it("should display general help with all commands", () => {
		const help = generateHelp();

		expect(help).to.include("MCPN CLI");
		expect(help).to.include("Usage");
		expect(help).to.include("Commands");
		expect(help).to.include("init");
		expect(help).to.include("add");
		expect(help).to.include("remove");
	});

	it("should display help for init command", () => {
		const help = generateCommandHelp("init");

		expect(help).to.include("init");
		expect(help).to.include("Usage");
		expect(help).to.include("Options");
		expect(help).to.include("--cursor");
		expect(help).to.include("--windsurf");
		expect(help).to.include("--headless");
	});

	it("should display help for add command", () => {
		const help = generateCommandHelp("add");

		expect(help).to.include("add");
		expect(help).to.include("Usage");
		expect(help).to.include("URL");
	});

	it("should display help for remove command", () => {
		const help = generateCommandHelp("remove");

		expect(help).to.include("remove");
		expect(help).to.include("Usage");
		expect(help).to.include("workflow");
	});

	it("should mention command aliases in help", () => {
		const help = generateHelp();

		expect(help).to.include("i (alias for add)");
		expect(help).to.include("rm (alias for remove)");
		expect(help).to.include("uninstall (alias for remove)");
	});

	it("should include backward compatibility info", () => {
		const help = generateHelp();

		expect(help).to.include("--config");
		expect(help).to.include("--preset");
	});
});
