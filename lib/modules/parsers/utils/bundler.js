const { rollup } = require('rollup')
const rollupPluginResolve = require('rollup-plugin-node-resolve')
const { logParserError, relPath, calcRelPath, readFileAsync } = require('./helpers.js')
const { getFileContent } = require('../../bus.js')
const vueParser = require('../types/vue.js')


module.exports = async function bundler(file, { format, entrySource, entryFilename }) {

  let content = null
  let deps = []
  let bundleName

  const plugins = [
    rollupPluginResolve({ browser: true }),
    vuePlugin({ deps, referrer: file.referrer || file.filename }),
  ]
  if (entrySource) plugins.push(entrySourcePlugin({ entryFilename, entrySource }))

  let rollupBundle
  try {
    rollupBundle = await rollup({ 
      input: file.sourceFilename || file.filename, 
      plugins,
      onwarn: warning => logParserError('ROLLUP', file, warning)
    })

    const bundleOptions = { format }
    if (format === 'iife') bundleOptions.name = bundleName = 'webo_' + Math.trunc(Math.random() * 10e8)

    const { code } = await rollupBundle.generate(bundleOptions)
    content = code

    const jsDeps = rollupBundle.modules.map(o => { return { filename: relPath(o.id), type: 'dep' } }).filter(o => o.filename !== file.filename && o.filename !== file.sourceFilename)
      .map(dep => dep.filename.endsWith('.vue') ? Object.assign(dep, { filename: dep.filename + '.js', sourceFilename: dep.filename }) : dep)
    deps.push(...jsDeps)
  } catch (error) {
    logParserError('ROLLUP', file, error)
    console.log(error.frame)
  }

  return { content, deps, bundleName }

}


function vuePlugin({ deps, referrer }) {
  return {
    async load(id) {
      const filename = relPath(id)
      if (filename.endsWith('.vue')) {
        let { content, deps: vueDeps } = await vueParser({ filename })
        vueDeps.forEach(dep => {
          const newRef = calcRelPath(referrer, dep.filename)
          content = content.replace(new RegExp(dep.ref, 'g'), newRef)
          dep.ref = newRef
        })
        deps.push(...vueDeps)
        return content
      }
      return (await readFileAsync(id)).toString()
    }
  }
}

function entrySourcePlugin({ entryFilename, entrySource }) {
  return {
    async load(id) {
      if (id.replace(/\\/g, '/').endsWith(entryFilename)) return entrySource
      return (await readFileAsync(id)).toString()
    }
  }
}