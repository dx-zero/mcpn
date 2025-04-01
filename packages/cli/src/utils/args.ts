import mri from 'mri'
import { resolve } from 'pathe'

export interface CommandLineArgs {
  configPath?: string
  presets: string[]
  _: string[]
}

export function parseArgs (argv = process.argv.slice(2)): CommandLineArgs {
  // Parse command-line flags via mri
  const { preset, config, _, ...rest } = mri(argv, {
    alias: {
      c: 'config'
    },
    // Force config and preset to parse as strings
    string: ['config', 'preset']
  })

  let configPath: string | undefined
  let presets: string[] = []

  if (config) {
    // Resolve the config path relative to cwd
    configPath = resolve(config.replace(/^['"]+|['"]+$/g, ''))
  }

  if (preset) {
    // Allow comma-separated presets
    presets = preset
      .split(',')
      .map((p: string) => p.trim())
      .filter(Boolean)
  } else if (!configPath) {
    // Only default to "thinking" if no config path and no preset
    presets = ['thinking']
  }

  return {
    configPath,
    presets,
    _: _
  }
}