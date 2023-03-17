import { transpile } from '../utils/transpiler.js'
import { minify } from '../utils/minifier.js'

export async function parse(source, filename, config) {

  let result = { content: source }

  if (config.transpile) {
    const transpileResult = await transpile(result.content, { presetName: 'transpileLegacy' })
    Object.assign(result, transpileResult)
  }

  if (config.minify) {
    const minifyResult = await minify(result.content)
    Object.assign(result, minifyResult)
  }

  return result

}