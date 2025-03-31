import { defineCommand } from 'citty';
import { colors } from 'consola/utils';
import { logger } from '../utils/logger';
import { configFileExists, loadMcpnConfig } from '../utils/config'; // Removed unused loadMcpnConfigOrFail
import { cwdArgs, logLevelArgs } from './_shared';
import { relative } from 'pathe';
import process from 'node:process';

const configGetCommand = defineCommand({
    meta: {
        name: 'get',
        description: 'Display the resolved MCPN configuration.',
    },
    args: {
        ...cwdArgs,
        ...logLevelArgs,
    },
    async run({ args }) {
        logger.info('Attempting to load MCPN configuration...');
        try {
            const configResult = await loadMcpnConfig(args.cwd);

            if (!configFileExists(configResult)) {
                 logger.warn(`No MCPN configuration file found in ${colors.cyan(configResult.cwd)}.`);
                 logger.info(`Consider running ${colors.cyan('mcpn init')} to create one.`);
                 return;
            }

            const configPath = configResult.configFile || configResult.cwd; // Fallback shouldn't happen if configFileExists is true, but good practice
            const relativeConfigPath = relative(process.cwd(), configPath);

            logger.success(`Loaded configuration from: ${colors.cyan(relativeConfigPath)}`);
            logger.box(JSON.stringify(configResult.config || {}, null, 2));

        } catch (error: any) {
             logger.error(`Failed to load configuration: ${error.message}`);
             if (args.logLevel === 'debug') {
                 console.error(error);
             }
             process.exit(1);
        }
    },
});

export default defineCommand({
    meta: {
        name: 'config',
        description: 'Manage MCPN configuration.',
    },
    args: {
         ...cwdArgs,
         ...logLevelArgs,
    },
    subCommands: {
        get: configGetCommand,
    },
    run(/*ctx*/) { // Removed unused ctx destructuring that caused type error
         // This runs if no subcommand is specified
         logger.info('Config command requires a subcommand (e.g., `get`). Use --help for details.');
         // Citty should automatically show help if no subcommand matches and args are present
    }
});