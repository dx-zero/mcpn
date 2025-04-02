/* eslint-disable no-var */

declare global {
	var __mcpn_cli__:
		| undefined
		| {
				entry: string;
				startTime: number;
		  };
}

export {};
