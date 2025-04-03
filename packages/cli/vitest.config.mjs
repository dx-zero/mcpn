import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		bail: 1,
		coverage: {
			include: ["src/**/*.ts"],
			exclude: ["src/@types/**"],
		},
	},
});
