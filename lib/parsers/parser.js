import fs from 'node:fs/promises'
import { calcContentHash } from './tools/cachebuster.js'
import * as files from './files.js'


/** @type {(filename: string, config: Webo.Config, options?: { type?: Webo.FileTypes, cacheContent: boolean }) => Promise<Webo.File>} */
export async function parse(filename, config, { type, cacheContent } = { type: undefined, cacheContent: false }) {

  const file = files.getFile(filename)
  if (type && type !== file.type) file.type = type
  // if (config.debug && !file.parseCount) file.parseCount = 0
  if (file.content) return file

  // console.debug('PARSE', filename)
  const source = await tryLoadSource(filename.replace('.legacy.', '.'))
  if (!source) return files.createFile()

  if (!file.type) file.type = files.detectType(filename, source)
  if (['dev-dep', 'raw'].includes(file.type)) return { ...file, content: source }
  const { parse: parseFileContent } = await import(`./types/${file.type}.js`)
  const { content, deps = {} } = await parseFileContent(source, filename, config)
  if (config.debug) file.parseCount ++
  // console.debug('PARSED', { filename, type: file.type, deps })
  if (cacheContent) file.content = content
  if (config.cachebust) file.hash = await calcContentHash(content)
  if (file.type !== 'js-legacy') files.attachFiles(deps)

  return { ...files.createFile(), content, deps }

}


/** @type {(filename: string) => Promise<string?>} */
async function tryLoadSource(filename) {
  try {
    return await fs.readFile(filename, 'utf8')
  } catch (error) {
    return null
  }
}
