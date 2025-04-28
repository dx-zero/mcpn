import type { InputPluginOption } from "rollup";
import { visualizer } from "rollup-plugin-visualizer";
import { defineBuildConfig } from "unbuild";

const isAnalysingSize = process.env.BUNDLE_SIZE === "true";

export default defineBuildConfig({
	declaration: !isAnalysingSize,
	failOnWarn: true,
	entries: [
		"src/index",
		{
			builder: "copy",
			input: "src/presets",
			outDir: "dist/presets",
			pattern: "**/*.yaml",
		},
	],
	hooks: {
		"rollup:options"(ctx, options) {
			// bundle yaml files
			if (!options.plugins) {
				options.plugins = [];
			}
			const plugins = options.plugins as InputPluginOption[];

			if (isAnalysingSize) {
				plugins.unshift(visualizer({ template: "raw-data" }));
			}

			// options.plugins.push(
      //   YAMLPlugin({
      //     // optional: include/exclude or custom `yaml` parse options
      //   }),
      // )
		},
	},
	rollup: {
		dts: {
			respectExternal: false,
		},
		inlineDependencies: true,
		resolve: {
			exportConditions: ["production", "node"],
		},
	},
	externals: [
		"@nuxt/test-utils",
		"fsevents",
		"node:url",
		"node:buffer",
		"node:path",
		"node:child_process",
		"node:process",
		"node:path",
		"node:os",
	],
});
