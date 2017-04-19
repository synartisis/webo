const commonjs = require('rollup-plugin-commonjs')
const resolve = require('rollup-plugin-node-resolve')
// const nodeGlobals = require('rollup-plugin-node-globals')
const replace = require('rollup-plugin-replace')
const hypothetical = require('rollup-plugin-hypothetical')
const alias = require('rollup-plugin-alias')

const rollup = require('rollup')
const fs = require('fs')
const { relPath, log } = require('../../utils')
const file = require('./file')()
const config = require('../../config')

const cache = new Map()


module.exports = () => {
  return Object.assign({}, file, {

    deps: [],
    vendor: new Map,

    async scriptLoader() {
      this.content = await this.readFile()
      return this
    },

    async load() {
      log('VERBOSE', 'TIMESTAMP', 'JS_LOADER', this.path)
      if (config.vendorFilename && config.vendorFilename.replace(/\.js$/g, '') + '.js' === this.filename()) return this
      if (this.type !== 'module') return this.scriptLoader()

      if (!cache.has(this.path)) cache.set(this.path, null)
      let bundle = await rollup.rollup({ 
        entry: this.path, 
        plugins: [ 
          resolve(), 
          commonjs(), 
          replace({ 'process.env.NODE_ENV': JSON.stringify('WEBO_development') }),
          // alias({ 'vue': 'vue/dist/vue.esm.js' })
        ],//, nodeGlobals() ],
        // cache: cache.get(this.path),
      })
      // console.log('**', require.resolve('vue'), __dirname, require('path').resolve('.'), require('path').resolve(this.path))


      const deps = bundle.modules
        .map(m => relPath(m.id))
        .filter(path => path !== this.path && !path.includes('commonjsHelpers') && !path.includes('process-es6/browser') && !path.includes('rollup-plugin'))
        .map(path => { return { path } })


        if(this.path==='src/client/landing/module.js') {
        //     // console.log('**', deps, Object.keys(bundle), bundle.modules.map(m=> Object.assign(m, { code:null, originalCode: null })))
        //     bundle.modules = bundle.modules.filter(o => o.id.includes('commonjsHelpers'))
        //     console.log('----------')
        //     let b = await rollup.rollup({
        //       entry: __dirname + '/roll.js',
        //       plugins: [ resolve(), commonjs() ],
        //     })
        //     // console.log(Object.keys(bundle), bundle.modules.map(m=> Object.assign(m, { code:null, originalCode: null })))
        //     console.log(b)
        //     console.log(b.generate({ format: 'iife' }).code)
        //     console.log('----------')
        // //     console.log('-----------------')
            // console.log(JSON.stringify(bundle.modules[bundle.modules.length - 1].ast.body, null, 2))
        // //     console.log(JSON.stringify(bundle.modules[4].ast.body, null, 2))
        // //     console.log('-----------------')
        // //     console.log(JSON.stringify(bundle.modules[bundle.modules.length - 1].ast.body.map(o => { return { type: o.type, specifiers: o.specifiers && o.specifiers.map(s => s.local && s.local.name) } }), null, 2))

        // //     console.log('-----------------')
        // //     // console.log(JSON.stringify(this.findDependencies(bundle.modules[bundle.modules.length - 1]), null, 2))
        // //     console.log(bundle.modules[bundle.modules.length - 1].resolvedIds)
        }

      let globals = Object.assign({}, config.globals)
      if (config.vendorFilename) {
        const rootModule = bundle.modules[bundle.modules.length - 1]
        const externals = resolveExternalDependencies(rootModule)
        globals = Object.assign({}, externals, config.globals)
        for (const [k, v] of Object.entries(globals)) {
          globals[require.resolve(k)] = v
        }
        // Object.assign(globals, externals)

        // globals['F:\\dev\\tmp\\devServer\\node_modules\\vue\\dist\\vue.runtime.esm.js'] = 'Vue'
        // globals['vue/dist/vue.runtime.esm'] = 'Vue'
        
        // console.log(globals, externals)

        const vendorDeps = deps.filter(o => o.path.includes('node_modules/')).map(o => o.path.substring(o.path.indexOf('node_modules/') + 'node_modules/'.length).replace('.js', ''))
        await Promise.all(
          vendorDeps.map(async (vdep, index) => {
            // console.log('***', vdep)
            const moduleName = globals[vdep] || config && config.globals[vdep.replace('.js', '')] || 'mod' + index
            const vendorRollup = await rollup.rollup({
              entry: './vendor-entry.js',
              plugins: [ 
                resolve(), 
                commonjs(), 
                //nodeGlobals(),
                // replace({ 'process.env.NODE_ENV': JSON.stringify( 'production' ) }), 
                hypothetical({ files: { './vendor-entry.js': `import mod from '${vdep}'; export default mod;` }, allowRealFiles: true }) ],
            })
            const { code } = vendorRollup.generate({ format: 'iife', moduleName })
            this.vendor.set(moduleName, code)
          })
        )
        bundle = await rollup.rollup({ 
          entry: this.path,
          external: vendorDeps.map(dep => require.resolve(dep)),
          plugins: [ resolve(), commonjs()],//, nodeGlobals() ],
          cache: this.cache,
          globals,
        })
      }


      let { code } = bundle.generate({ format: 'iife', globals })
      cache.set(this.path, bundle)
      this.content = code
      this.deps = deps.filter(o => !o.path.includes('node_modules'))

      log('VERBOSE', 'TIMESTAMP', 'JS_LOADER ENDS', this.path)
      return this
    },

  })

}

function resolveExternalDependencies(module) {
  const deps = {}
  const importStatements = module.ast.body
    .filter(o => o.type === 'ImportDeclaration')
    .forEach(o => {
      // console.log('^^^^^^', JSON.stringify(o, null, 2))
      const k = o.source && o.source.value
      const specifier = o.specifiers && o.specifiers.find(sp => sp.local && sp.local.name)
      const v = specifier && specifier.local.name
      // console.log('^^^^^^ --->', k, v)
      
      if (k && v && !k.startsWith('.')) deps[k] = v
    })
  const requireStatements = module.ast.body.filter(o => o.type === 'VariableDeclaration' && o.declarations).map(o => {
    return {

    }
  })
  return deps
}

