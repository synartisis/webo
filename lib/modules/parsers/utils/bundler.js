const { rollup } = require('rollup')
const rollupPluginResolve = require('rollup-plugin-node-resolve')
const { logParserError, relPath, readFileAsync } = require('./helpers.js')


module.exports = async function bundler(file, { format, entrySource, entryFilename }) {

  try {
    const plugins = [
      rollupPluginResolve({ browser: true })
    ]
    if (entrySource) plugins.push({ 
      async load(id) {
        if (id.replace(/\\/g, '/').endsWith(entryFilename)) return entrySource
        return (await readFileAsync(id)).toString()
      }
    })
    const rollupBundle = await rollup({ 
      input: file.sourceFilename || file.filename, 
      plugins,
      onwarn: warning => logParserError('ROLLUP', file, warning)
    })
    const bundleOptions = { format }
    if (format === 'iife') bundleOptions.name = 'webo_' + Math.trunc(Math.random() * 10e8)
    const content = (await rollupBundle.generate(bundleOptions)).code
    const deps = rollupBundle.modules.map(o => { return { filename: relPath(o.id), type: 'dep' } }).filter(o => o.filename !== file.filename && o.filename !== file.sourceFilename)
    return { content, deps, bundleName: bundleOptions.name }
  } catch (error) {
    logParserError('ROLLUP', file, error)
    throw new Error(error)
  }


}