export interface PresetConfig {
	// Define the structure of your preset YAML
	// Example:
	description?: string;
	prompt?: string;
	// Add other expected fields from your YAML structure
	[key: string]: unknown; // Use unknown instead of any for type safety
}

export interface LoadedPreset {
	name: string;
	config: PresetConfig;
	filePath: string;
}
