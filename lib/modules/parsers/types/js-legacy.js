const bundler = require('../utils/bundler.js')
const transpiler = require('../utils/transpiler.js')
const minifier = require('../utils/minifier.js')


module.exports = async function jsLegacy(file) {

  const out = { content: null, deps: [] }

  const { srcRoot } = global.options
  const { minify } = global.parserOptions

  {
    const { content, deps } = await bundler(file, { format: 'iife' })
    Object.assign(out, { content, deps })
  }
  

  out.content = await transpiler(out.content, file, { preset: 'legacy' })


  if (minify) {
    out.content = await minifier(out.content, file)
  }


  Object.assign(file, out)
  return file

}
