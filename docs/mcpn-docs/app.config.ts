export default defineAppConfig({
	ui: {
		colors: {
			primary: "sky",
			neutral: "zinc",
		},
	},
	uiPro: {
		footer: {
			slots: {
				root: "border-t border-(--ui-border)",
				left: "text-sm text-(--ui-text-muted)",
			},
		},
	},
	seo: {
		siteName: "mcpn Documentation",
	},
	header: {
		title: "mcpn",
		to: "/",
		logo: {
			alt: "mcpn Logo",
			light: "",
			dark: "",
		},
		search: true,
		colorMode: true,
		links: [
			{
				icon: "i-simple-icons-github",
				to: "https://github.com/dx-zero/mcpn",
				target: "_blank",
				"aria-label": "mcpn on GitHub",
			},
		],
	},
	footer: {
		credits: `Copyright © ${new Date().getFullYear()} mcpn | Made by`,
		colorMode: false,
		links: [
			{
				icon: "i-simple-icons-github",
				to: "https://github.com/dx-zero/mcpn",
				target: "_blank",
				"aria-label": "mcpn on GitHub",
			},
		],
	},
	toc: {
		title: "Table of Contents",
		bottom: {
			title: "Community",
			edit: "https://github.com/dx-zero/mcpn/edit/main/docs",
			links: [
				{
					icon: "i-lucide-star",
					label: "Star on GitHub",
					to: "https://github.com/dx-zero/mcpn",
					target: "_blank",
				},
			],
		},
	},
});
