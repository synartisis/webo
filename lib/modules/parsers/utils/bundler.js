const { rollup } = require('rollup')
const rollupPluginResolve = require('rollup-plugin-node-resolve')
const { logParserError, relPath, calcRelPath, readFileAsync } = require('./helpers.js')
const { getFileContent } = require('../../bus.js')
const vueParser = require('../types/vue.js')


module.exports = async function bundler(file, { format, entrySource, entryFilename }) {

  try {
    const vueDeps = []
    const plugins = [
      rollupPluginResolve({ browser: true })
    ]
    plugins.push({ 
      async load(id) {
        const filename = relPath(id)
        if (filename.endsWith('.vue')) {
          let { content, deps } = await vueParser({ filename })
          deps.forEach(dep => {
            const newRef = calcRelPath(file.referrer || file.filename, dep.filename)
            content = content.replace(new RegExp(dep.ref, 'g'), newRef)
            dep.ref = newRef
          })
          vueDeps.push(...deps)
          return content
        }
        return (await readFileAsync(id)).toString()
      }
    })
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
      .map(dep => dep.filename.endsWith('.vue') ? Object.assign(dep, { filename: dep.filename + '.js', sourceFilename: dep.filename }) : dep)
      deps.push(...vueDeps)
    return { content, deps, bundleName: bundleOptions.name }
  } catch (error) {
    logParserError('ROLLUP', file, error)
    throw new Error(error)
  }


}