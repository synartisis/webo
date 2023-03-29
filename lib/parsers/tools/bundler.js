import fs from 'node:fs/promises'
import { rollup } from 'rollup'
import { parse as parseVue } from '../types/vue.js'
import { calcContentHash } from '../../utils/utils.js'


/** @type {(filename: string, options: { format?: 'esm' | 'iife' }) => Promise<{ content: string, deps: Webo.FileDeps }>} */
export async function bundle(filename, options = { format: undefined }, config) {

  const outputOptions = { format: options.format, name: '' }
  if (options.format === 'iife') outputOptions.name = '__BUNDLE_NAME__'
  const plugins = [ vuePlugin(config) ]
  
  let rollupBundle
  try {
    rollupBundle = await rollup({
      input: filename,
      plugins,
      onwarn: warning => console.log('ROLLUP', filename, warning),
    })
  } catch (error) {
    log(`_RED_Bundler parse error`)
    // @ts-ignore
    log(`_RED_${error.loc.file} _GRAY_(col:${error.loc.column}, line:${error.loc.line})`)
    // @ts-ignore
    error.frame.split('\n').map(l => log(`_GRAY_${l}`))
    if (config.command === 'build') throw new Error('PARSE ERROR')
    return { content: '', deps: {} }
  }

  const { output } = await rollupBundle.generate({ format: options.format })
  const { code, modules } = output[0]
  const bundleName = 'webo_' + await calcContentHash(code)

  const deps = Object.keys(modules).filter(m => m !== filename)
  .reduce((flat, m) => { flat[m] = { type: 'dev-dep' }; return flat }, {})

  return { content: code.replace(/__BUNDLE_NAME__/g, bundleName), deps }

}


/** @type {(filename: string) => Promise<any>} */
export async function getResolvedIds(filename) {
  try {
    const rollupBundle = await rollup({
      input: filename,
      onwarn: warning => console.log('ROLLUP', filename, warning),
    })
    return rollupBundle.cache?.modules?.find(o => o.id === filename)?.resolvedIds ?? {}
  } catch (error) {
    log(`_LIGHTRED_${error}`)
    return {}
  }
}


/** @type {(config: Webo.Config) => any} */
function vuePlugin(config) {
  return {
    name: 'vue-plugin',
    /** @type {(id: string) => Promise<string | undefined>} */
    async load(id) {
      if (!(id.endsWith('.vue'))) return undefined
      const source = await fs.readFile(id, 'utf8')
      let { content } = await parseVue(source, id, config)
      return content
    }
  }
}
