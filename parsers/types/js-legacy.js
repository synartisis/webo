exports.parse = async function parse(source, filename, config) {

  const sourceFilename = filename.replace('.legacy.', '.')
  let result = { content: source }

  const { bundle } = require('../utils/bundler.js')
  const bundleResult = await bundle(sourceFilename, { format: 'iife' }, config)
  Object.assign(result, bundleResult)

  const { transpile } = require('../utils/transpiler.js')
  const transpileResult = await transpile(result.content, { presetName: 'transpileLegacy' })
  Object.assign(result, transpileResult)

  if (config.minify) {
    const { minify } = require('../utils/minifier.js')
    const minifyResult = await minify(result.content)
    Object.assign(result, minifyResult)
  }

  return result

}