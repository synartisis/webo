const rollup = require('rollup')
const commonjs = require('rollup-plugin-commonjs')
const resolve = require('rollup-plugin-node-resolve')
const replace = require('rollup-plugin-replace')
const hypothetical = require('rollup-plugin-hypothetical')
// const nodeGlobals = require('rollup-plugin-node-globals')

const { relPath, log } = require('../../utils')

const cache = new Map()


module.exports = async function(options) {

  // log('VERBOSE', 'TIMESTAMP', 'LOADING', this.path)
  const timestamp = new Date()
  if (!this.type) return 
  if (this.type === 'script') return this.content = this.source

  if (!cache.has(this.path)) cache.set(this.path, null)
  let bundle = await rollup.rollup({ 
    entry: this.path, 
    plugins: [ 
      resolve(), 
      commonjs(), 
      // replace({ 'process.env.NODE_ENV': JSON.stringify('WEBO_development') }),
      hypothetical({ files: options.files, allowRealFiles: true }),
      // nodeGlobals(),
      // alias({ 'vue': 'vue/dist/vue.esm.js' })
    ],//, nodeGlobals() ],
    cache: cache.get(this.path),
  })

  const deps = bundle.modules
    .map(m => relPath(m.id))
    .filter(path => path !== this.path && !path.includes('commonjsHelpers') && !path.includes('process-es6/browser') && !path.includes('rollup-plugin'))
    .map(path => { return { path } })

  let { code } = bundle.generate({ format: 'iife' })
  code = 'var process = { env: { NODE_ENV: "development" } };\n' + code
  this.content = code
  this.deps = deps.filter(o => !o.path.includes('node_modules'))
  cache.set(this.path, bundle) 
  log('VERBOSE', 'LOAD', this.path, new Date() - timestamp)

}