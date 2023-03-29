import { bundle } from '../tools/bundler.js'
import { transpile } from '../tools/transpiler.js'
import { minify } from '../tools/minifier.js'
import { cachebust } from '../tools/cachebuster.js'
import { getResolvedIds } from '../tools/bundler.js'

export async function parse(source, filename, config) {

  // console.log('MODULE', filename)
  let result = { content: source }

  if (config.bundle) {
    const bundleResult = await bundle(filename, { format: 'esm' }, config)
    Object.assign(result, bundleResult)
  }

  if (config.cachebust) {
    const cacheBustedContent = await cachebustDeps(filename, result.content)
    if (cacheBustedContent) result.content = cacheBustedContent
  }


  if (config.transpile) {
    const transpileResult = await transpile(result.content, { presetName: 'transpileModern' })
    Object.assign(result, transpileResult)
  }

  if (config.minify) {
    const minifyResult = await minify(result.content)
    Object.assign(result, minifyResult)
  }

  return result

}


async function cachebustDeps(filename, source) {
  const resolvedIds = await getResolvedIds(filename)

  let content = source
  for await (const resolvedId of Object.keys(resolvedIds)) {
    const refFilename = resolvedIds[resolvedId].id
    const hash = await cachebust(refFilename, {}, { referrer: filename })
    if (!hash) continue
    const ext = resolvedId.split('.').pop()
    const refFinal = resolvedId.substring(0, resolvedId.length - ext.length) + hash + '.' + ext
    content = content.replaceAll(resolvedId, refFinal)
  }

  return content
}