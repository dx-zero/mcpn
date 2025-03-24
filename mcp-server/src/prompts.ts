import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { DevToolsConfig, PromptConfig } from "./config.js";

// In ES modules, __dirname is not available directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directory where preset YAML files are stored
const PRESETS_DIR = path.join(__dirname, "presets");

/**
 * Applies configuration to a default prompt
 *
 * @param {string} defaultPrompt - The base prompt text to modify
 * @param {PromptConfig} [config] - Optional configuration to apply to the prompt
 * @returns {string} The final prompt with configuration applied
 */
const applyConfig = (defaultPrompt: string, config?: PromptConfig): string => {
  if (!config) {
    return defaultPrompt;
  }

  // Use prompt if provided, otherwise use default
  let finalPrompt = config.prompt || defaultPrompt;

  // Append context if provided
  if (config.context) {
    finalPrompt += `\n\n${config.context}`;
  }

  // Add tools section if tools are provided
  if (config.tools && config.tools.length > 0) {
    finalPrompt += `\n\n## Available Tools\n`;

    if (config.toolMode === "sequential") {
      finalPrompt += "Follow this sequence of tools to complete the task:\n\n";

      config.tools.forEach((tool, index) => {
        finalPrompt += `${index + 1}. **${tool.name}**`;
        if (tool.description) {
          finalPrompt += `: ${tool.description}`;
        }
        finalPrompt += "\n";
      });
    } else {
      // Default to situational mode
      finalPrompt += "You can use these tools as needed:\n\n";

      config.tools.forEach((tool) => {
        finalPrompt += `- **${tool.name}**`;
        if (tool.description) {
          finalPrompt += `: ${tool.description}`;
        }
        finalPrompt += "\n";
      });
    }
  }

  return finalPrompt;
};

/**
 * Discovers and loads all YAML configuration files in the presets directory
 *
 * @returns {Record<string, any>} An object mapping preset names to their configuration objects
 * @throws Will log an error if there are issues reading the directory or parsing YAML files
 */
function discoverPresetConfigs(): { [key: string]: any } {
  const presetConfigs: { [key: string]: any } = {};

  try {
    // Get all YAML files in the presets directory
    const presetFiles = fs
      .readdirSync(PRESETS_DIR)
      .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"));

    // Load each preset file
    for (const presetFile of presetFiles) {
      const presetPath = path.join(PRESETS_DIR, presetFile);
      const presetName = path.basename(presetFile, path.extname(presetFile));

      try {
        const content = fs.readFileSync(presetPath, "utf-8");
        const presetConfig = yaml.load(content) as DevToolsConfig;

        // Store the configuration with the preset file name as the key
        presetConfigs[presetName] = presetConfig;
      } catch (error) {
        console.error(`Error loading preset file ${presetFile}:`, error);
      }
    }
  } catch (error) {
    console.error("Error discovering preset configurations:", error);
  }

  return presetConfigs;
}

/**
 * Creates a prompt generation function for a specific mode and preset
 *
 * @param {string} modeName - The name of the mode to create a prompt function for
 * @param {string} presetName - The name of the preset configuration to use
 * @param {Record<string, any>} presetConfigs - Object containing all loaded preset configurations
 * @returns {(config?: DevToolsConfig) => string} A function that generates a prompt based on the mode and preset
 */
function createPromptFunction(
  modeName: string,
  presetName: string,
  presetConfigs: { [key: string]: any }
): (config?: DevToolsConfig) => string {
  return (config?: DevToolsConfig) => {
    try {
      const presetConfig = presetConfigs[presetName];

      if (presetConfig && presetConfig[modeName]?.prompt) {
        return applyConfig(presetConfig[modeName].prompt, config?.[modeName]);
      }
    } catch (error) {
      console.error(
        `Error generating prompt for ${modeName} from ${presetName}:`,
        error
      );
    }

    // Fallback if preset prompt not found
    return `# ${modeName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) =>
        l.toUpperCase()
      )}\n\nNo default prompt found for this tool.`;
  };
}

// Discover all preset configurations
const presetConfigs = discoverPresetConfigs();

// Object to store prompt functions for all modes
const promptFunctions: Record<string, (config?: DevToolsConfig) => string> = {};

/**
 * Initializes prompt functions by processing all discovered preset configurations
 * @returns Record of prompt functions indexed by mode name
 */
function initializePromptFunctions(): Record<
  string,
  (config?: DevToolsConfig) => string
> {
  // Process each preset file
  Object.entries(presetConfigs).forEach(([presetName, presetConfig]) => {
    // Process each mode in the preset
    Object.keys(presetConfig).forEach((modeName) => {
      // Register the prompt function for this mode
      promptFunctions[modeName] = createPromptFunction(
        modeName,
        presetName,
        presetConfigs
      );
    });
  });

  return promptFunctions;
}

// Initialize prompt functions on module load
initializePromptFunctions();

export { promptFunctions, initializePromptFunctions };
