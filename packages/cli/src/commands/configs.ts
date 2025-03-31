import { existsSync, promises as fsp } from 'node:fs'
import process from 'node:process'
import { defineCommand } from 'citty'
import { resolve, join, dirname } from 'pathe'
import { consola } from 'consola'
import { fileURLToPath } from 'node:url'
import { downloadTemplate } from 'giget'

const IDE_OPTIONS = ['cursor', 'windsurf', 'cline', 'copilot'] as const
type IDEOption = typeof IDE_OPTIONS[number]

const __filename = fileURLToPath(import.meta.url)

export default defineCommand({
  meta: {
    name: 'configs',
    description: 'Initialize IDE-specific configuration files',
  },
  args: {
    ide: {
      type: 'string',
      description: 'IDE to initialize configuration for',
      default: 'cursor',
      options: IDE_OPTIONS,
    },
    force: {
      type: 'boolean',
      description: 'Override existing files without prompting',
      default: false,
    },
    cwd: {
      type: 'string',
      description: 'Working directory',
    },
  },
  async run(ctx) {
    try {
      consola.info('Starting IDE configuration initialization...')
      
      const selectedIDE = ctx.args.ide as IDEOption || 'cursor'
      consola.info(`Selected IDE: ${selectedIDE}`)
      
      if (!IDE_OPTIONS.includes(selectedIDE)) {
        consola.error(`Invalid IDE option. Available options: ${IDE_OPTIONS.join(', ')}`)
        process.exit(1)
      }

      // Create IDE directory (e.g., .cursor)
      const targetDir = resolve(ctx.args.cwd || process.cwd(), `.${selectedIDE}`)
      consola.info(`Creating configuration directory: ${targetDir}`)
      
      try {
        // Download template from GitHub
        const templatePath = `ex0-init/${selectedIDE}`
        consola.info(`Downloading template: ${templatePath}...`)
        
        try {
          await downloadTemplate(`gh:instructa/ex0/templates/${templatePath}`, {
            dir: targetDir,
            force: ctx.args.force
          })
          consola.success(`Successfully downloaded and initialized ${selectedIDE} configuration!`)
          consola.info(`Configuration files are located in: ${targetDir}`)
        } catch (error) {
          consola.error(`Failed to download template for IDE: ${selectedIDE}`, error)
          consola.info('Please check if the template exists in the repository.')
          process.exit(1)
        }
      } catch (error) {
        consola.error('Failed to initialize configuration:', error)
        process.exit(1)
      }
    } catch (error) {
      consola.error('Failed to initialize configuration:', error)
      process.exit(1)
    }
  },
})