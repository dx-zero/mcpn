import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	entries: [
		"src/index",
		{
			builder: "copy",
			input: "src/presets",
			outDir: "dist/presets",
			pattern: "**/*.yaml",
		},
	],
	declaration: true, // Generates .d.ts files
	clean: true, // Clean the dist directory before building
	rollup: {
		emitCJS: true, // Emit CommonJS output
		inlineDependencies: true, // Inline dependencies
	},
});
