exports.parse = async function parse(source, filename, config) {

  // console.log('MODULE', filename)
  let result = { content: source }

  if (config.bundle) {
    const { bundle } = require('../utils/bundler.js')
    const bundleResult = await bundle(filename, { format: 'esm' }, config)
    Object.assign(result, bundleResult)
  }

  if (config.transpile) {
    const { transpile } = require('../utils/transpiler.js')
    const transpileResult = await transpile(result.content, { presetName: 'transpileModern' })
    Object.assign(result, transpileResult)
  }

  if (config.minify) {
    const { minify } = require('../utils/minifier.js')
    const minifyResult = await minify(result.content)
    Object.assign(result, minifyResult)
  }

  return result

}