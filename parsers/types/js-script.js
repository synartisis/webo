exports.parse = async function parse(source, filename, config) {

  let result = { content: source }

  if (config.transpile) {
    const { transpile } = require('../utils/transpiler.js')
    const transpileResult = await transpile(result.content, { presetName: 'transpileLegacy' })
    Object.assign(result, transpileResult)
  }

  if (config.minify) {
    const { minify } = require('../utils/minifier.js')
    const minifyResult = await minify(result.content)
    Object.assign(result, minifyResult)
  }

  return result

}