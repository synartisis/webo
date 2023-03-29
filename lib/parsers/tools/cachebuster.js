import path from 'node:path'
import { parse } from '../parser.js'
import { getFile } from '../files.js'
import { calcFilenameHash, calcContentHash } from '../../utils/utils.js'
import { parsable } from '../../utils/utils.js'


/** @type {(filename: string, config: Webo.Config, options: { type?: Webo.FileTypes, referrer?: string, ignoreIfMissing?: boolean }) => Promise<string | null>} */
export async function cachebust(filename, config, { type = undefined, referrer = undefined, ignoreIfMissing = false } = {}) {
  if (!parsable(filename)) {
    try {
      return await calcFilenameHash(filename)
    } catch (error) {
      if (!ignoreIfMissing) {
        throw new Error(`cannot find ${path.relative('.', filename)} referred by ${path.relative('.', referrer)}`, { error })
      }
      return null
    }
  }
  const file = getFile(filename)
  if (file.hash) return file.hash
  const { content } = await parse(filename, config, { type, cacheContent: config.command === 'build' })
  if (!content) throw new Error(`cannot find ${path.relative('.', filename)} referred by ${path.relative('.', referrer)}`)
  const hash = await calcContentHash(content)
  return hash
}