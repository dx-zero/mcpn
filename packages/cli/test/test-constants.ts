import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CLI_ENTRY_POINT = path.join(__dirname, "..", "bin", "mcpn.mjs"); 

export function getModulePaths(importMetaUrl: string) {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = path.dirname(__filename);
  return { __filename, __dirname };
}