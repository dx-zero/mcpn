import { runCommand as _runCommand, runMain as _runMain } from 'citty'
import { fileURLToPath } from 'node:url'
import main from './main'

import { commands } from './commands'


globalThis.__mcpn_cli__ = globalThis.__mcpn_cli__ || {
  // Programmatic usage fallback
  startTime: Date.now(),
  entry: fileURLToPath(
    new URL(
      import.meta.url.endsWith('.ts')
        ? '../bin/mcpn.mjs'
        : '../../bin/mcpn.mjs',
      import.meta.url,
    ),
  ),
}

// extend citty for mcpn features
export const runMain = () => _runMain(main)

// Subcommands
export async function runCommand(
  name: string,
  argv: string[] = process.argv.slice(2),
  data: { overrides?: Record<string, any> } = {},
) {
  if (!(name in commands)) {
    throw new Error(`Invalid command ${name}`)
  }

  return await _runCommand(await commands[name as keyof typeof commands](), {
    rawArgs: argv,
    data: {
      overrides: data.overrides || {},
    },
  })
}