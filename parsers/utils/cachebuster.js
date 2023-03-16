const path = require('path')
const { parse } = require('../parser.js')
const { getFile } = require('../files.js')
const { calcFilenameHash, calcContentHash } = require('../../lib/utils.js')
const { parsable } = require('../../webo-settings.js')

exports.cachebust = async function cachebust(filename, config, { type, referrer } = {}) {
  if (!parsable(filename)) {
    try {
      return await calcFilenameHash(filename)
    } catch (error) {
      throw new Error(`cannot find ${path.relative('.', filename)} referred by ${path.relative('.', referrer)}`, { error })
    }
  }
  const file = getFile(filename)
  if (file.hash) return file.hash
  const { content } = await parse(filename, config, { type, cacheContent: config.command === 'build' })
  if (!content) throw new Error(`cannot find ${path.relative('.', filename)} referred by ${path.relative('.', referrer)}`)
  const hash = await calcContentHash(content)
  return hash
}