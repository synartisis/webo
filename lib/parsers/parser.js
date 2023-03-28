import fs from 'node:fs/promises'
import { calcContentHash } from '../utils/utils.js'
import * as files from './files.js'


/** @type {(filename: string, config: Webo.Config, options?: { type?: Webo.FileTypes, cacheContent: boolean }) => Promise<{ content?: string, deps?: string[] }>} */
export async function parse(filename, config, { type, cacheContent } = { type: undefined, cacheContent: false }) {

  const file = files.getFile(filename)
  if (type && type !== file.type) file.type = type
  if (config.debug && !file.parseCount) file.parseCount = 0
  if (file.content) return file

  // console.log('PARSE', filename)
  const source = await tryLoadSource(filename.replace('.legacy.', '.'))
  if (!source) return { content: undefined }

  if (!file.type) file.type = files.detectType(filename, source)
  if (['dev-dep', 'raw'].includes(file.type)) return { ...file, content: source }
  const { parse } = await import(`./types/${file.type}.js`)
  const { content, deps = {} } = await parse(source, filename, config)
  if (config.debug) file.parseCount ++
  // console.log('PARSED', { filename, type: file.type, deps })
  if (cacheContent) file.content = content
  if (config.cachebust) file.hash = await calcContentHash(content)
  if (!(['js-legacy'].includes(file.type))) files.attachFiles(deps)

  return { content, deps }

}


/** @type {(filename: string) => Promise<string?>} */
async function tryLoadSource(filename) {
  try {
    return await fs.readFile(filename, 'utf8')
  } catch (error) {
    return null
  }
}
