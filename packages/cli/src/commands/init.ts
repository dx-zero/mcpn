import { existsSync, mkdirSync } from 'node:fs'
import { promises as fsp } from 'node:fs'
import process from 'node:process'

import { defineCommand } from 'citty'
import { colors } from 'consola/utils'
import { relative, resolve } from 'pathe'

//4import { dxLogo, themeColor } from '../utils/ascii'
import { logger } from '../utils/logger'
import { cwdArgs, logLevelArgs } from './_shared'
import { detectIDE } from '../utils/detectIde'

// Define a basic structure for the config file
interface McpnConfig {
  ide?: string;
  // Add other future config options here
}

// Function to create the config file
async function createConfigFile(projectPath: string, config: McpnConfig) {
  const configFilePath = resolve(projectPath, 'mcpn.config.ts');
  // Use JSON.stringify for values to avoid syntax issues in the output file
  const configContent = `// Basic MCPN configuration file
// You can define types for this object if needed, e.g.:\n// import type { McpnConfig } from './.mcp-workflows/types';\n\nexport default {\n  ide: ${JSON.stringify(config.ide || 'unknown')},\n  // Add other configuration options here in the future\n}; // Add 'satisfies McpnConfig;' if you define the type elsewhere\n`;

  await fsp.writeFile(configFilePath, configContent);
  logger.success(`Created configuration file: ${colors.cyan(relative(process.cwd(), configFilePath))}`);
}

export default defineCommand({
  meta: {
    name: 'init',
    description: 'Initialize an MCPN project structure',
  },
  args: {
    ...cwdArgs,
    ...logLevelArgs,
    dir: {
      type: 'positional',
      description: 'Project directory',
      default: '',
    }
  },
  async run(ctx) {
    if (ctx.args.dir === '') {
      ctx.args.dir = await logger.prompt('Where would you like to create your project?', {
        placeholder: './my-mcpn-project',
        type: 'text',
        default: 'my-mcpn-project',
        cancel: 'reject',
      }).catch(() => process.exit(1))
    }

    const cwd = resolve(ctx.args.cwd)
    const projectPath = resolve(cwd, ctx.args.dir)
    const relativeProjectPath = relative(cwd, projectPath) || '.'

    logger.info(`Initializing MCPN project in ${colors.cyan(relativeProjectPath)}...`)

    try {
      if (!existsSync(projectPath)) {
        mkdirSync(projectPath, { recursive: true })
        logger.success(`Created project directory: ${colors.cyan(relativeProjectPath)}`)
      } else {
        logger.info(`Project directory already exists: ${colors.cyan(relativeProjectPath)}`)
      }

      const workflowsPath = resolve(projectPath, '.mcp-workflows')
      if (!existsSync(workflowsPath)) {
        mkdirSync(workflowsPath, { recursive: true })
        logger.success(`Created workflow directory: ${colors.cyan(relative(cwd, workflowsPath))}`)
      } else {
         logger.info(`Workflow directory already exists: ${colors.cyan(relative(cwd, workflowsPath))}`);
      }

      const ide = detectIDE()
      if (ide) {
        logger.info(`Detected IDE: ${ide}`)
      } else {
        logger.info('Could not automatically detect IDE.')
      }

      // Create the config file
      await createConfigFile(projectPath, { ide });

    } catch (err) {
        logger.error(`Failed to initialize project directories: ${(err as Error).message}`)
        process.exit(1)
    }

    logger.log(`\n✨ MCPN project initialized successfully in ${colors.cyan(relativeProjectPath)}`)
    logger.log(`  Created ${colors.cyan('.mcp-workflows')} directory.`)
    logger.log(`  Created ${colors.cyan('mcpn.config.ts')} configuration file.`)
    logger.log('\nNext steps:')
    const steps = [
        relativeProjectPath !== '.' && `\`cd ${relativeProjectPath}\``,
        'Define your workflows in the `.mcp-workflows` directory.',
        'Run commands using `mcpn run <workflow>`.'
    ].filter(Boolean)

    for (const step of steps) {
      logger.log(` › ${step}`)
    }
  },
})
