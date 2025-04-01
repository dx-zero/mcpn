import { defineCommand } from 'citty'
import { parseArgs } from './utils/args'
import { cwdArgs } from './commands/_shared'
import { description, name, version } from '../package.json'
import { commands } from './commands'
import { loadPreset } from './utils/presets'
import { logger } from './utils/logger'

export const main = defineCommand({
  meta: {
    name,
    version,
    description
  },
  // Keep cwd arguments, but remove config/preset from Citty so there's no conflict
  args: {
    ...cwdArgs,
    command: {
      type: 'positional',
      required: false,
    }
  },
  subCommands: commands,

  // Use the setup hook to parse extra flags with mri
  setup(ctx) {
    // Initialize ctx.data if it doesn't exist
    ctx.data = ctx.data || {}
    
    const { configPath, presets } = parseArgs()
    ctx.data.configPath = configPath
    ctx.data.presets = presets
  },

  async run(ctx) {
    const presetsToRun = ctx.data.presets as string[] || []
    const cwd = ctx.args.cwd || process.cwd()

    // If no command is given AND presets are specified, load and use them
    if (!ctx.args.command && presetsToRun.length > 0) {
      logger.info(`Attempting to run with preset(s): ${presetsToRun.join(', ')}`)

      for (const presetName of presetsToRun) {
        const loadedPreset = await loadPreset(presetName, cwd)

        if (loadedPreset) {
          logger.success(`Successfully loaded preset '${presetName}' from ${loadedPreset.filePath}`) 
          // TODO: Implement actual logic to *use* the loadedPreset.config
          // For now, just log the loaded config
          logger.info(`Preset '${presetName}' Config:`, loadedPreset.config)
          // Example: Apply the prompt if it exists
          if (loadedPreset.config.prompt) {
            logger.info(`Applying prompt for '${presetName}'... (Implementation needed)`) 
            // Here you would integrate with your prompt execution logic
          }
          // Add logic for other preset config keys like debugger_mode, etc.

        } else {
          // loadPreset already logs a warning/error if not found
          logger.error(`Could not run preset '${presetName}'.`) 
        }
      }
      // Indicate completion or next steps after attempting all presets
      logger.info("Preset execution flow finished (implementation pending).")

    } else if (!ctx.args.command) {
      // No command and no presets specified
      logger.info('No command or preset specified. Use `mcpn --help` for usage.')
    }
    // If ctx.args.command exists, citty handles subcommand routing automatically.
  }
})

export default main