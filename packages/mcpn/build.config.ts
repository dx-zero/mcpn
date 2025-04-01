import { defineBuildConfig } from 'unbuild'
import fs from 'node:fs/promises'
import path from 'node:path'
//import yaml from '@rollup/plugin-yaml';
//import replace from '@rollup/plugin-replace';
import type { InputPluginOption } from 'rollup'

// Get preset names during build
// const presetsDir = path.resolve(__dirname, 'src/presets');
// let availablePresets: string[] = [];
// try {
//   availablePresets = fs
//     .readdirSync(presetsDir)
//     .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
//     .map((file) => path.basename(file, path.extname(file)));
// } catch (error) {
//   console.warn(`Could not read presets directory at ${presetsDir}:`, error);
// }
// const availablePresetsString = JSON.stringify(availablePresets);

export default defineBuildConfig({
  entries: [
    'src/index',
    // Add other entries if needed, e.g., 'src/server' if it's meant to be a separate entry point
    // 'src/server' 
  ],
  declaration: true, // Generates .d.ts files
  clean: true, // Clean the dist directory before building
  rollup: {
    emitCJS: true, // Emit CommonJS output
    inlineDependencies: true, // Inline dependencies
  },
  hooks: {
    // Copy presets after the build is done
    async 'build:done'(ctx) {
      const srcPresetsDir = path.resolve(ctx.options.rootDir, 'src/presets');
      const distPresetsDir = path.resolve(ctx.options.outDir, 'presets');

      console.log('srcPresetsDir', srcPresetsDir);

      try {
        // Create the destination directory if it doesn't exist
        await fs.mkdir(distPresetsDir, { recursive: true });
        
        // Read source directory
        const files = await fs.readdir(srcPresetsDir);
        
        // Copy each file
        await Promise.all(files.map(async (file) => {
          const srcFile = path.join(srcPresetsDir, file);
          const destFile = path.join(distPresetsDir, file);
          await fs.copyFile(srcFile, destFile);
        }));
        
        console.log(`Copied presets from ${srcPresetsDir} to ${distPresetsDir}`);
      } catch (error) {
        console.error(`Error copying presets: ${error}`);
      }
    },
    'rollup:options'(ctx, options) {      
      const plugins = (options.plugins ||= []) as InputPluginOption[]
      
     // plugins.push(yaml());

      //console.log('availablePresetsString', availablePresetsString);

      // Add the replace plugin
      // plugins.push(
      //   replace({
      //     preventAssignment: true, // Recommended setting
      //     // Inject the list of presets, replacing a placeholder string
      //     '__AVAILABLE_PRESETS__': availablePresetsString,
      //   })
      // );
    },
  },
  // Add externals if necessary, similar to the cli package if it uses node built-ins
  // externals: [
  //   'node:fs',
  //   'node:path',
  //   // ... other node built-ins or large dependencies
  // ],
}) 