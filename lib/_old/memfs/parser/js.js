const path = require('path')
const { rollup } = require('rollup')
const babel = require('@babel/core')
const uglify = require('uglify-es')
const { readFileAsync, relPath, logv } = require('../../utils/utils.js')

module.exports = {

  async load() {

    let content
    let deps = []
  
    const isLegacy = this.filename.endsWith('.legacy.js')
    const bundle = this.options.parserOptions.bundle && (this.type === 'module' || isLegacy)
    const transpile = this.options.parserOptions.transpile
    const minify = this.options.parserOptions.minify && !this.filename.endsWith('.min.js')

    if (bundle) {
      try {
        const rollupBundle = await rollup({ 
          input: this.sourceFilename || this.filename, 
          onwarn: rollupError
        })
        const { code } = await rollupBundle.generate({ format: !isLegacy ? 'es' : 'iife' })
        content = code
        deps = rollupBundle.modules.map(o => { return { filename: relPath(o.id), type: 'module' } }).filter(o => o.filename !== this.filename)
      } catch (error) {
        rollupError(error)
      }
    } else {
      console.log(111)
      content = await this.loadSource()
      console.log(222)
    }
  
    if (transpile) {
      let presets = [[ require.resolve('@babel/preset-env'), { modules: false }]]
      const { code } = await babel.transform(content, { presets })
      content = code
    }
  
    if (minify) {
      const { code, error } = uglify.minify(content)
      if (error) logv(`_RED_${error} on minify ${this.filename}`)
      content = code
    }
  
    // console.log(this.filename, deps.map(o => o.filename))
    // return { content, deps }
    this.content = content
    this.deps = deps
  

  }

  
}



function rollupError({ message, loc }) {
  logv(`_RED_${message}${loc ? ' line:' + loc.line +',col:' + loc.column : ''}`)
}