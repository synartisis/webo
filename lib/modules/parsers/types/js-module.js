const bundler = require('../utils/bundler.js')
const transpiler = require('../utils/transpiler.js')
const minifier = require('../utils/minifier.js')
const { readFileAsync } = require('../utils/helpers.js')


module.exports = async function jsModule(file) {

  const { bundle, transpile, minify } = global.parserOptions

  const out = { content: null, deps: [] }

  if (bundle) {
    const { content, deps } = await bundler(file, { format: 'es' })
    Object.assign(out, { content, deps })
  } else {
    out.content = (await readFileAsync(file.filename)).toString()
  }

  if (transpile) {
    out.content = await transpiler(out.content, file, { preset: 'modern' })
  }

  if (minify) {
    out.content = await minifier(out.content, file)
  }
  
  Object.assign(file, out)
  return file
  
}
