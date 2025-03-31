import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/server',
  ],
  declaration: 'node16',
  clean: true
})
