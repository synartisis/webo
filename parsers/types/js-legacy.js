import { bundle } from '../utils/bundler.js'
import { transpile } from '../utils/transpiler.js'
import { minify } from '../utils/minifier.js'

export async function parse(source, filename, config) {

  const sourceFilename = filename.replace('.legacy.', '.')
  let result = { content: source }

  const bundleResult = await bundle(sourceFilename, { format: 'iife' }, config)
  Object.assign(result, bundleResult)

  const transpileResult = await transpile(result.content, { presetName: 'transpileLegacy' })
  Object.assign(result, transpileResult)

  if (config.minify) {
    const minifyResult = await minify(result.content)
    Object.assign(result, minifyResult)
  }

  return result

}