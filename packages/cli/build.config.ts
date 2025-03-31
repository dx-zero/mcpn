import { defineBuildConfig } from 'unbuild'
import { visualizer } from 'rollup-plugin-visualizer'
import ViteYaml from '@modyfi/vite-plugin-yaml';
import type { InputPluginOption } from 'rollup'

const isAnalysingSize = process.env.BUNDLE_SIZE === 'true'


export default defineBuildConfig({
  declaration: !isAnalysingSize,
  failOnWarn: true,
  entries: [
    'src/index',
  ],
  hooks: {
    'rollup:options'(ctx, options) {      

      // bundle yaml files
      const plugins = (options.plugins ||= []) as InputPluginOption[]
      plugins.push(ViteYaml());

      if (isAnalysingSize) {
        plugins.unshift(visualizer({ template: 'raw-data' }))
      }
    },
  },
  rollup: {
    dts: {
      respectExternal: false,
    },
    inlineDependencies: true,
    resolve: {
      exportConditions: ['production', 'node'],
    },
  },
  externals: [
    '@nuxt/test-utils',
    'fsevents',
    'node:url',
    'node:buffer',
    'node:path',
    'node:child_process',
    'node:process',
    'node:path',
    'node:os',
  ],
})
