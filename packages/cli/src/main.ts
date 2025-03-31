import { defineCommand } from 'citty'
// import { consola } from 'consola'
import { commands } from './commands'
import { cwdArgs } from './commands/_shared'
import { description, name, version } from '../package.json'

export const main = defineCommand({
  meta: {
    name: 'mcpn',
    version,
    description,
  },
  args: {
    ...cwdArgs,
    command: {
      type: 'positional',
      required: false,
    },
  },
  subCommands: commands,
  async setup(ctx) {
    //const command = ctx.args._[0]
    // @TODO
    // const dev = command === 'dev'
    // setupGlobalConsole({ dev })
  },
})

export default main