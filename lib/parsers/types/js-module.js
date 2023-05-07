import { bundle } from '../tools/bundler.js'
import { transpile } from '../tools/transpiler.js'
import { minify } from '../tools/minifier.js'
import { cachebust } from '../tools/cachebuster.js'
import { getResolvedIds } from '../tools/bundler.js'


/** @type {(source: string, filename: string, config: Webo.Config) => Promise<{ content: string, deps: Webo.FileDeps }>} */
export async function parse(source, filename, config) {

  // console.log('MODULE', filename)
  let result = { content: source, deps: {} }

  if (config.bundle) {
    const bundleResult = await bundle(filename, config, { format: 'esm' })
    Object.assign(result, bundleResult)
  }

  if (config.cachebust) {
    const { content: cacheBustedContent, deps } = await cachebustDeps(filename, result.content, config)
    if (cacheBustedContent) result.content = cacheBustedContent
    result.deps = deps
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



/** @type {(filename: string, source: string, config: Webo.Config) => Promise<{ content: string, deps: Webo.FileDeps }>} */
async function cachebustDeps(filename, source, config) {
  const resolvedIds = await getResolvedIds(filename)
  /** @type {Webo.FileDeps} */
  const deps = {}

  let content = source
  for await (const resolvedId of Object.keys(resolvedIds)) {
    const refFilename = resolvedIds[resolvedId].id
    deps[refFilename] = { type: 'js-module' }
    const hash = await cachebust(refFilename, config, { referrer: filename })
    if (!hash) continue
    const ext = resolvedId.split('.').pop()
    if (!ext) continue
    const refFinal = resolvedId.substring(0, resolvedId.length - ext.length) + hash + '.' + ext
    content = content.replaceAll(resolvedId, refFinal)
  }

  return { content, deps }
}