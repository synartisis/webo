const { readFileAsync } = require('../utils/helpers.js')
const transpiler = require('../utils/transpiler.js')
const minifier = require('../utils/minifier.js')

module.exports = async function jsScript(file) {

  const { transpile, minify } = global.parserOptions

  const out = { content: (await readFileAsync(file.filename)).toString(), deps: [] }

  if (transpile) {
    out.content = await transpiler(out.content, file, { preset: 'legacy' })
  }

  if (minify) {
    out.content = await minifier(out.content, file)
  }

  Object.assign(file, out)
  return file

}
