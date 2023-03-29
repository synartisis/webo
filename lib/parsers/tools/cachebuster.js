import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import path from 'node:path'
import { parse } from '../parser.js'
import { getFile } from '../files.js'
import { parsable } from '../../utils/utils.js'


/** @type {(filename: string, config: Webo.Config, options: { type?: Webo.FileTypes, referrer: string, ignoreIfMissing?: boolean }) => Promise<string | null>} */
export async function cachebust(filename, config, { type = undefined, referrer, ignoreIfMissing = false }) {
  if (!parsable(filename)) {
    try {
      return await calcFileHash(filename)
    } catch (error) {
      if (!ignoreIfMissing) {
        throw new Error(`cannot find ${path.relative('.', filename)} referred by ${path.relative('.', referrer)}`, { cause: error })
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


/** @type {(content: string, length?: number) => Promise<string>} */
export async function calcContentHash(content, length = 6) {
  if (!content) throw new Error('calcContentHash: empty content')
  return crypto.createHash('md5').update(content).digest('hex').substring(0, length)
}


/** @type {(filename: string, length?: number) => Promise<string>} */
async function calcFileHash(filename, length = 6) {
  const content = await fs.readFile(filename)
  return crypto.createHash('md5').update(content).digest('hex').substring(0, length)
}
