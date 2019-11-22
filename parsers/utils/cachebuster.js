const { parse } = require('../parser.js')
const { getFile } = require('../files.js')
const { calcHash } = require('../../lib/utils.js')
const { parsable } = require('../../webo-settings.js')

exports.cachebust = async function cachebust(filename, config, { type } = {}) {
  if (!parsable(filename)) return calcHash(filename)
  const file = getFile(filename)
  if (file.hash) return file.hash
  const { content } = await parse(filename, config, { type, cacheContent: config.command === 'build' })
  const hash = await calcHash(null, content)
  return hash
}