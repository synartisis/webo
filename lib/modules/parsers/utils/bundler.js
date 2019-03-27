const { rollup } = require('rollup')
const rollupPluginResolve = require('rollup-plugin-node-resolve')
const { logParserError, relPath, readFileAsync, calcAssetPath, rewritePath, calcHash } = require('./helpers.js')
const { getFileContent } = require('../../bus.js')
const vueParser = require('../types/vue.js')


module.exports = async function bundler(file, { format }) {

  let content = null
  let deps = []
  let bundleName

  // try {
  //   await rollup({ 
  //     input: file.sourceFilename || file.filename, 
  //     plugins: [
  //       depsPlugin({ deps, referrer: file.filename })
  //     ],
  //     onwarn: warning => logParserError('ROLLUP', file, warning)
  //   })
  // } catch (error) { }


  const plugins = [
    rollupPluginResolve({ browser: true }),
    vuePlugin({ deps, filename: file.filename, referrer: file.referrer || file.filename }),
  ]

  let rollupBundle
  try {
    rollupBundle = await rollup({ 
      input: file.sourceFilename || file.filename, 
      plugins,
      onwarn: warning => logParserError('ROLLUP', file, warning)
    })

    const bundleOptions = { format }
    if (format === 'iife') bundleOptions.name = bundleName = 'webo_' + await calcHash(file.sourceFilename || file.filename)// Math.trunc(Math.random() * 10e8)

    const { code } = await rollupBundle.generate(bundleOptions)
    content = code

    // const nestedDeps = rollupBundle.modules.map(o => relPath(o.id))
    //   .filter(o => o !== file.filename && o !== file.sourceFilename && !deps.find(d => d.filename === o || d.sourceFilename === o))
    //   .map(o => ({ filename: o, type: 'dep' }))
    // deps.push(...nestedDeps)
    const jsDeps = rollupBundle.modules.map(o => { return { filename: relPath(o.id), type: 'dep' } }).filter(o => o.filename !== file.filename && o.filename !== file.sourceFilename)
      .map(dep => dep.filename.endsWith('.vue') ? Object.assign(dep, { filename: dep.filename + '.js', sourceFilename: dep.filename }) : dep)
      // .filter(dep => !deps.find(o => o.filename === dep.filename))
    deps.push(...jsDeps)
  } catch (error) {
    logParserError('ROLLUP', file, error)
    // console.log(error.frame)
    deps = file.deps || []
  }

  return { content, deps, bundleName }

}



// function depsPlugin({ deps, referrer }) {
//   return {
//     async load(id) {
//       if (relPath(id) === referrer) return null
//       return ''
//     },
//     resolveId(importee) {
//       if (importee === referrer) return importee
//       const assetPath = calcAssetPath(referrer, importee)
//       const filename = assetPath.endsWith('.vue') ? assetPath + '.js' : assetPath
//       deps.push({ filename, sourceFilename: assetPath, type: 'dep' })
//       return null
//     }
//   }
// }

function vuePlugin({ deps, filename, referrer }) {
  return {
    async load(id) {
      const filename = relPath(id)
      if (filename.endsWith('.vue')) {
        let { content, deps: vueDeps } = await vueParser({ filename })
        vueDeps.forEach(dep => {
          const newRef = rewritePath(filename, referrer, dep.ref)
          content = content.replace(new RegExp(dep.ref, 'g'), newRef)
          dep.ref = newRef
        })
        deps.push(...vueDeps)
        // deps.push(...vueDeps.filter(vd => !deps.find(o => o.filename === vd.filename)))
        return content
      }
      return (await readFileAsync(id)).toString()
    }
  }
}
