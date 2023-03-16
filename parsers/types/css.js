const path = require('path')
const { cachebust } = require('../utils/cachebuster.js')

exports.parse = async function parse(source, filename, config) {

  let content = source

  if (config.cachebust) {
    content = await cacheBusting(content, filename, config)
  }

  return { content }

}


const reStripComments = /(?!<\")\/\*[^\*]+\*\/(?!\")/
const reRefs = /url\((?<ref>.+)\)/g
/** @type (content: string, filename: string, config: object) => Promise<string> */
async function cacheBusting(content, filename, config) {
  const dir = path.dirname(filename)
  const contentWithoutComments = content.replace(reStripComments)

  const matches = contentWithoutComments.matchAll(reRefs)
  for await (const match of matches) {
    const ref = match.groups.ref.trim()
    if (!ref) continue
    const hash = await cachebust(path.join(dir, ref), config)
    const ext = ref.split('.').pop()
    const refFinal = ref.substring(0, ref.length - ext.length) + hash + '.' + ext
    content = content.replaceAll(ref, refFinal)
  }

  return content
}
