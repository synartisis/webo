import path from 'node:path'
import { cachebust } from '../tools/cachebuster.js'

/** @type {(source: string, filename: string, config: Webo.Config) => Promise<{ content: string }>} */
export async function parse(source, filename, config) {

  let content = source

  if (config.cachebust) {
    content = await cacheBusting(content, filename, config)
  }

  return { content }

}



const reStripComments = /(?!<\")\/\*[^\*]+\*\/(?!\")/g
const reRefs = /url\((?<ref>.+?)\)/g
/** @type {(content: string, filename: string, config: Webo.Config) => Promise<string>} */
async function cacheBusting(content, filename, config) {
  const dir = path.dirname(filename)
  const contentWithoutComments = content.replaceAll(reStripComments, '')

  const matches = contentWithoutComments.matchAll(reRefs)
  for await (const match of matches) {
    const ref = match.groups?.ref.trim().replaceAll("'", '').replaceAll('"', '').split('?')[0].split('#')[0]
    if (!ref) continue
    if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('/') || ref.startsWith('data:')) continue
    const ext = ref.split('.').pop()
    if (!ext) continue
    const hash = await cachebust(path.join(dir, ref), config, { referrer: filename, ignoreIfMissing: ignoreIfMissing(ext) })
    const refFinal = [ref.substring(0, ref.length - ext.length - 1), hash, ext].filter(Boolean).join('.')
    content = content.replaceAll(ref, refFinal)
  }

  return content
}

/** @type {(ext: string) => boolean} */
function ignoreIfMissing(ext) {
  return ['eot', 'woff', 'ttf', 'svg'].includes(ext)
}
