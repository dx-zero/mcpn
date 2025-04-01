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
  }
})

export default main