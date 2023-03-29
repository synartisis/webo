import { bundle } from '../tools/bundler.js'
import { transpile } from '../tools/transpiler.js'
import { minify } from '../tools/minifier.js'

/** @type {(source: string, filename: string, config: Webo.Config) => Promise<{ content: string }>} */
export async function parse(source, filename, config) {

  const sourceFilename = filename.replace('.legacy.', '.')
  let result = { content: source }

  const bundleResult = await bundle(sourceFilename, config, { format: 'iife' })
  Object.assign(result, bundleResult)

  const transpileResult = await transpile(result.content, { presetName: 'transpileLegacy' })
  Object.assign(result, transpileResult)

  if (config.minify) {
    const minifyResult = await minify(result.content)
    Object.assign(result, minifyResult)
  }

  return result

}