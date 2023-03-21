import path from 'node:path'
import { cachebust } from '../utils/cachebuster.js'

export async function parse(source, filename, config) {

  let content = source

  if (config.cachebust) {
    content = await cacheBusting(content, filename, config)
  }

  return { content }

}


const reStripComments = /(?!<\")\/\*[^\*]+\*\/(?!\")/g
const reRefs = /url\((?<ref>.+?)\)/g
/** @type {(content: string, filename: string, config: object) => Promise<string>} */
async function cacheBusting(content, filename, config) {
  const dir = path.dirname(filename)
  const contentWithoutComments = content.replaceAll(reStripComments, '')

  const matches = contentWithoutComments.matchAll(reRefs, {  })
  for await (const match of matches) {
    const ref = match.groups.ref.trim().replaceAll("'", '').replaceAll('"', '').split('?')[0].split('#')[0]
    if (!ref) continue
    const ext = ref.split('.').pop()
    const hash = await cachebust(path.join(dir, ref), config, { referrer: filename, ignoreIfMissing: ignoreIfMissing(ext) })
    const refFinal = [ref.substring(0, ref.length - ext.length - 1), hash, ext].filter(Boolean).join('.')
    content = content.replaceAll(ref, refFinal)
  }

  return content
}

function ignoreIfMissing(ext) {
  return ['eot', 'woff', 'ttf', 'svg'].includes(ext)
}
