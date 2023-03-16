const { rollup } = require('rollup')
const { parse: parseVue } = require('../types/vue.js')
const { calcContentHash } = require('../../lib/utils.js')


exports.bundle = async function bundle(filename, { format } = {}, config) {

  const outputOptions = { format }
  if (format === 'iife') outputOptions.name = '__BUNDLE_NAME__'
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
    log(`_RED_${error.loc.file} _GRAY_(col:${error.loc.column}, line:${error.loc.line})`)
    error.frame.split('\n').map(l => log(`_GRAY_${l}`))
    if (config.command === 'build') throw new Error('PARSE ERROR')
    return { content: '' }
  }

  const { output } = await rollupBundle.generate(outputOptions)
  const { code, modules } = output[0]
  const bundleName = 'webo_' + await calcContentHash(code)

  const deps = Object.keys(modules).filter(m => m !== filename)
  .reduce((flat, m) => { flat[m] = { type: 'dev-dep' }; return flat }, {})

  return { content: code.replace(/__BUNDLE_NAME__/g, bundleName), deps: deps || undefined }

}


exports.getResolvedIds = async function getResolvedIds(filename) {
  try {
    const rollupBundle = await rollup({
      input: filename,
      onwarn: warning => console.log('ROLLUP', filename, warning),
    })
    return rollupBundle.cache.modules.find(o => o.id === filename).resolvedIds
  } catch (error) {
    log(`_LIGHTRED_${error}`)
    return {}
  }
}


const { readFile } = require('fs').promises
function vuePlugin(config) {
  return {
    async load(id) {
      if (!(id.endsWith('.vue'))) return undefined
      const source = (await readFile(id)).toString()
      let { content } = await parseVue(source, id, config)
      return content
    }
  }
}
