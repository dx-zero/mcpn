import { existsSync, promises as fsp } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname, join } from 'pathe'
import yaml from 'js-yaml'
import { logger } from './logger'

export interface PresetConfig {
  // Define the structure of your preset YAML
  // Example:
  description?: string
  prompt?: string
  // Add other expected fields from your YAML structure
  [key: string]: any // Allow other top-level keys
}

export interface LoadedPreset {
  name: string
  config: PresetConfig
  filePath: string
}

// Helper function to get the path to the built-in presets directory
function getBuiltInPresetsDir(): string {
  const currentFilePath = fileURLToPath(import.meta.url)
  const utilsDir = dirname(currentFilePath)
  const srcDir = dirname(utilsDir)
  return resolve(srcDir, 'presets')
}

// Helper to get the local workflows directory
function getLocalWorkflowsDir(cwd: string): string {
  return resolve(cwd, '.mcp-workflows')
}

/**
 * Finds and loads a preset configuration by name.
 * It first checks the local .mcp-workflows directory, then the built-in presets.
 *
 * @param presetName The name of the preset (e.g., 'coding')
 * @param cwd The current working directory to check for local presets.
 * @returns The loaded preset config and its path, or null if not found.
 */
export async function loadPreset(presetName: string, cwd: string): Promise<LoadedPreset | null> {
  const localWorkflowsDir = getLocalWorkflowsDir(cwd)
  const localFilePath = join(localWorkflowsDir, `${presetName}.yaml`)

  // 1. Check local .mcp-workflows directory
  if (existsSync(localFilePath)) {
    try {
      logger.debug(`Attempting to load local preset: ${localFilePath}`)
      const content = await fsp.readFile(localFilePath, 'utf-8')
      const config = yaml.load(content) as PresetConfig
      return { name: presetName, config, filePath: localFilePath }
    } catch (error: any) {
      logger.warn(`Failed to load local preset ${localFilePath}: ${error.message}`)
      // Continue to check built-in presets
    }
  }

  // 2. Check built-in presets directory
  const builtInPresetsDir = getBuiltInPresetsDir()
  const builtInFilePath = join(builtInPresetsDir, `${presetName}.yaml`)

  if (existsSync(builtInFilePath)) {
    try {
      logger.debug(`Attempting to load built-in preset: ${builtInFilePath}`)
      const content = await fsp.readFile(builtInFilePath, 'utf-8')
      const config = yaml.load(content) as PresetConfig
      return { name: presetName, config, filePath: builtInFilePath }
    } catch (error: any) {
      logger.error(`Failed to load built-in preset ${builtInFilePath}: ${error.message}`)
      return null // Critical failure if built-in fails
    }
  }

  logger.warn(`Preset '${presetName}' not found locally or in built-in presets.`)
  return null
} 