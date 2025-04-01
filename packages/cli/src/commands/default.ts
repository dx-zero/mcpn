import type { Argv } from "mri";
import { resolve } from "pathe";
import consola from "consola";
import {
  findProjectRoot,
  parseArgs,
  loadConfig,
} from "..";

export default async function defaultMain(rawArgs: Argv) {

  const args = parseArgs(process.argv.slice(2));
  const logger = consola.create({
    stdout: process.stdout,
    stderr: process.stderr,
  });

  // 1: Running from root directory
  // 2: Running from components directory - npx codefetch /home/user/max/project
  const cwd = resolve(rawArgs._[0] /* bw compat */ || rawArgs.dir || "");
  const projectRoot = findProjectRoot(cwd);

  if (projectRoot !== cwd) {
    const shouldExit = await logger.prompt(
      `Warning: It's recommended to run codefetch from the root directory (${projectRoot}). Use --include-dirs instead.\nExit and restart from root?`,
      {
        type: "confirm",
      }
    );

    if (shouldExit) {
      process.exit(0);
    }
    logger.warn("Continuing in current directory. Some files might be missed.");
  }

  process.chdir(cwd);

  const config = await loadConfig(cwd, args);

}
