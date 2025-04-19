import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import { McpTestClient } from "@mcpn/test-utils";
import { CLI_ENTRY_POINT } from "./test-constants";

/** Get __filename and __dirname in ESM context */
export function getModulePaths(importMetaUrl: string) {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = path.dirname(__filename);
  return { __filename, __dirname };
}

/** Write a YAML object to a file */
export function writeYamlFile(filePath: string, data: any) {
  const yamlStr = yaml.dump(data);
  fs.writeFileSync(filePath, yamlStr, "utf-8");
}

/** Remove a file if it exists */
export function removeFileIfExists(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/** Create a new test client */
export function createTestClient() {
  return new McpTestClient({ cliEntryPoint: CLI_ENTRY_POINT });
}

/** Ensure directory exists and write a YAML object to a file */
export function ensureDirAndWriteYamlFile(filePath: string, data: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  writeYamlFile(filePath, data);
}

/**
 * Write YAML data to a file path relative to the module URL.
 * Ensures the directory exists.
 */
export function writeYamlRelativeToModule(importMetaUrl: string, relativeFilePath: string, data: any) {
  const { __dirname } = getModulePaths(importMetaUrl);
  const filePath = path.join(__dirname, relativeFilePath);
  ensureDirAndWriteYamlFile(filePath, data);
}

/**
 * Write the template YAML to both src and dist locations for a given template name
 */
export function writeTemplateYaml(
  importMetaUrl: string,
  templateName: string,
  dataOrFactory: any | (() => any)
) {
  const data = typeof dataOrFactory === "function" ? dataOrFactory() : dataOrFactory;

  const srcRelPath = `../src/presets/${templateName}.yaml`;
  const distRelPath = `../dist/presets/${templateName}.yaml`;

  writeYamlRelativeToModule(importMetaUrl, srcRelPath, data);
  writeYamlRelativeToModule(importMetaUrl, distRelPath, data);
}

/**
 * Remove the template YAML files from both src and dist locations for a given template name
 */
export function removeTemplateYaml(importMetaUrl: string, templateName: string) {
  const { __dirname } = getModulePaths(importMetaUrl);

  const srcPath = path.join(__dirname, `../src/presets/${templateName}.yaml`);
  const distPath = path.join(__dirname, `../dist/presets/${templateName}.yaml`);

  if (fs.existsSync(srcPath)) fs.unlinkSync(srcPath);
  if (fs.existsSync(distPath)) fs.unlinkSync(distPath);
}
