const { readFile } = require('fs').promises
const { calcContentHash } = require('../lib/utils.js')
const files = require('./files.js')


exports.parse = async function parse(filename, config = {}, { type, cacheContent } = {}) {

  const file = files.getFile(filename)
  if (type && type !== file.type) file.type = type
  if (config.debug && !file.parseCount) file.parseCount = 0
  if (file.content) return file

  // console.log('PARSE', filename)
  const source = await tryLoadSource(filename.replace('.legacy.', '.'))
  if (!source) return { content: undefined }

  if (!file.type) file.type = files.detectType(filename, source)
  if (['dev-dep', 'raw'].includes(file.type)) return { ...file, content: source }
  const { parse } = require(`./types/${file.type}.js`)
  const { content, deps = {} } = await parse(source, filename, config)
  if (config.debug) file.parseCount ++
  // console.log('PARSED', { filename, type: file.type, deps })
  if (cacheContent) file.content = content
  if (config.cachebust) file.hash = await calcContentHash(content)
  if (!(['js-legacy'].includes(file.type))) files.attachFiles(deps)

  return { content, deps }

}



async function tryLoadSource(filename) {
  try {
    return await readFile(filename, 'utf8')
  } catch (error) {
    return null
  }
}
