/**
 * Help display functionality for MCPN CLI
 */

/**
 * Generate general help text for the CLI
 * @returns Formatted help text
 */
export function generateHelp(): string {
  return `MCPN CLI

Usage:
  npx mcpn [command] [options]

Commands:
  init                           Initialize a new project with MCPN workflow support
  add, i (alias for add)         Add a workflow preset from a URL
  remove, rm (alias for remove), uninstall (alias for remove)  Remove a workflow or preset

Options:
  --config    Path to configuration directory (backward compatible)
  --preset    Comma-separated preset names to load (backward compatible)
  --help      Show this help

Run without a command to start the MCP server (backward compatible mode).
Run 'npx mcpn [command] --help' for more information on a specific command.`;
}

/**
 * Generate help text for a specific command
 * @param command The command to display help for
 * @returns Formatted command-specific help text
 */
export function generateCommandHelp(command: string): string {
  switch (command) {
    case "init":
      return `init - Initialize a new project with MCPN workflow support

Usage:
  npx mcpn init [options]

Options:
  --cursor     Configure for Cursor IDE
  --windsurf   Configure for Windsurf IDE
  --cline      Configure for Cline IDE
  --rootcode   Configure for Rootcode IDE
  --headless   Configure in headless mode (no IDE integration)
  --help       Show this help`;

    case "add":
      return `add - Add a workflow preset from a URL

Usage:
  npx mcpn add <URL> [options]
  npx mcpn i <URL> [options]  (alias)

Options:
  --force      Overwrite existing files with the same name
  --help       Show this help`;

    case "remove":
      return `remove - Remove a workflow or preset

Usage:
  npx mcpn remove <workflow-name> [options]
  npx mcpn rm <workflow-name> [options]  (alias)
  npx mcpn uninstall <workflow-name> [options]  (alias)

Options:
  --help       Show this help`;

    default:
      return `Unknown command: ${command}\n\n${generateHelp()}`;
  }
}
