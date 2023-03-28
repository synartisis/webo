import path from 'node:path'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fss from 'node:fs'


const COLORS = { 
  GREEN: '\x1b[32m', RED: '\x1b[31m', YELLOW: '\x1b[33m', DIM: '\x1b[2m', CYAN: '\x1b[36m', GRAY: '\x1b[90m', LIGHTRED: '\x1b[91m', RESET: '\x1b[0m' 
}


/** @type {(verbose: boolean) => void} */
export function setGlobals(verbose) {
  global.log = log
  global.logv = verbose ? global.log : () => null
}

/** @type {(filename: string, length: number) => Promise<string>} */
export async function calcFilenameHash(filename, length = 6) {
  const content = await fs.readFile(filename)
  return crypto.createHash('md5').update(content).digest('hex').substring(0, length)
}


/** @type {(content: string, length?: number) => Promise<string>} */
export async function calcContentHash(content, length = 6) {
  if (!content) throw new Error('calcContentHash: empty content')
  return crypto.createHash('md5').update(content).digest('hex').substring(0, length)
}


/** @type {(filename: string) => string} */
export function relativePath(filename) {
  return path.relative(path.resolve('.'), filename)
}


/** @type {(dir: string, type: 'file' | 'dir') => Promise<string[]>} */
export async function readdirp(dir, type) {
  if (!type) throw new Error(`readdirp: type argument is required`)
  if (!dir.endsWith(path.sep)) dir += path.sep
  const entries = await fs.readdir(dir, { withFileTypes: true })
  let files = []
  if (type === 'dir') files.push(dir)
  for await (const entry of entries) {
    if (entry.isSymbolicLink()) continue
    let entryPath = path.resolve(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(... await readdirp(entryPath, type))
    } else {
      if (type === 'file') files.push(entryPath)
    }
  }
  return files
}


/** @type {string[]} */
const _watchingDirs = []
/** @type {(dirnames: string[], listener: Function) => void} */
export function watchDirs(dirnames, listener) {
  if (!dirnames) return
  for (const dirname of dirnames) {
    if (_watchingDirs.includes(dirname)) continue    
    _watchingDirs.push(dirname)
    let lastrun = Date.now()
    fss.watch(dirname, (eventType, filename) => {
      const now = Date.now()
      if (now < lastrun + 300) return
      lastrun = now
      const filepath = dirname + filename
      setTimeout(() => 
        fss.stat(filepath, (err, stat) => {
          // check if modified in the last 3 seconds
          if (err) {
            if (err.code === 'ENOENT') {
              return listener('remove', filepath)
            } else {
              throw err
            }
          }
          if (stat.mtimeMs < now - 3 * 1000) return
          if (stat.isFile()) {
            return listener('change', filepath)
          } else {
            const dirpath = filepath.endsWith(path.sep) ? filepath : filepath + path.sep
            // console.debug('DIR', {filepath, dirpath, eventType, filename})
            watchDirs([ dirpath ], listener)
          }
        })
      , 100)
    })
  }
}


/** @type {(message?: any, ...optionalParams: any[]) => void} */
function log(...args) {
  const colorKeys = Object.keys(COLORS)
  args.forEach(arg => {
    const time = new Date().toISOString().split('T').pop()?.substring(3)
    if (typeof arg === 'object') {
      console.dir(arg)
    } else {
      let ret = arg.startsWith('\r') ? '\r' : ''
      // @ts-ignore
      colorKeys.forEach(clr => arg = arg.replace(new RegExp(`_${clr}_`, 'g'), COLORS[clr]).replace(/\r/g, ''))
      process.stdout.write(`${ret}${COLORS.YELLOW}${time}${COLORS.RESET} : ${arg}${COLORS.RESET} `)
    }
    if (typeof args[args.length - 1] !== 'object') process.stdout.write('\n')
  })
}
