import path from 'node:path'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fss from 'node:fs'


const COLORS = { 
  GREEN: '\x1b[32m', RED: '\x1b[31m', YELLOW: '\x1b[33m', DIM: '\x1b[2m', CYAN: '\x1b[36m', GRAY: '\x1b[90m', LIGHTRED: '\x1b[91m', RESET: '\x1b[0m' 
}


/** @type {(verbose: boolean) => void} */
export function setGlobals(verbose) {
  // global.weboStarted = Date.now()
  // global.timeSpent = () => Math.round(10 * (Date.now() - weboStarted) / 1000) / 10
  global.log = log
  global.logv = verbose ? global.log : () => null
}


export async function calcFilenameHash(filename, length = 6) {
  const content = await fs.readFile(filename)
  return crypto.createHash('md5').update(content).digest('hex').substring(0, length)
}


export async function calcContentHash(content, length = 6) {
  if (!content) throw new Error('calcContentHash: empty content')
  return crypto.createHash('md5').update(content).digest('hex').substring(0, length)
}


export function relativePath(filename) {
  return path.relative(path.resolve('.'), filename)
}



export async function readdirp(dir, { type, includes, excludes } = {}) {
  if (includes) includes = [].concat(includes)
  if (excludes) excludes = [].concat(excludes)

  if (!dir.endsWith(path.sep)) dir += path.sep
  const entries = await fs.readdir(dir, { withFileTypes: true })
  let files = []
  if (test(dir, includes, excludes)) files.push(dir)
  files
  .push(...
    await Promise.all(
      entries
        .filter(entry => !(entry.isSymbolicLink()))
        .map(async entry => {
          const entryPath = path.resolve(dir, entry.name)
          return entry.isDirectory() && !mustExclude(entryPath, excludes) ? readdirp(entryPath, { type, includes, excludes }) : entryPath
        })
      )
    )
  return files.filter(o => test(o, includes, excludes)).reduce((flat, fileOrArray) => flat.concat(fileOrArray), [])
    .filter(file => (!type || (type === 'dir') === file.endsWith(path.sep)) && (test(file, includes, excludes)))
}
function mustInclude(s, includes) { return !includes || includes.some(m => m.test(s)) }
function mustExclude(s, excludes) { return !!(excludes && excludes.some(m => m.test(s))) }
function test(s, includes, excludes) { return mustInclude(s, includes) && !mustExclude(s, excludes) }


const _watchingDirs = []
export function watchDirs(dirnames, listener) {
  if (!dirnames) return
  dirnames.forEach(dirname => {
    if (_watchingDirs.includes(dirname)) return
    _watchingDirs.push(dirname)
    let lastrun = Date.now()
    fss.watch(dirname, (eventType, filename) => {
      const now = Date.now()
      if (now < lastrun + 300) return;
      lastrun = now
      const filepath = dirname + filename
      setTimeout(() => 
        fss.stat(filepath, (err, stat) => {
          // check if modified in the last 3 seconds
          if (err) {
            if (err.code === 'ENOENT') {
              return listener('remove', filepath)
            } else {
              throw new Error(err)
            }
          }
          if (stat.mtimeMs < now - 3 * 1000) return
          if (stat.isFile()) {
            return listener('change', filepath)
          } else {
            const dirpath = filepath.endsWith(path.sep) ? filepath : filepath + path.sep
            // console.log('DIR', {filepath, dirpath, eventType, filename})
            watchDirs([ dirpath ], listener)
          }
        })
      , 100)
    })
  })
}


function log(...args) {
  const colorKeys = Object.keys(COLORS)
  args.forEach(arg => {
    const time = new Date().toISOString().split('T').pop().substring(3)
    if (typeof arg === 'object') {
      console.dir(arg)
    } else {
      let ret = arg.startsWith('\r') ? '\r' : ''
      colorKeys.forEach(clr => arg = arg.replace(new RegExp(`_${clr}_`, 'g'), COLORS[clr]).replace(/\r/g, ''))
      process.stdout.write(`${ret}${COLORS.YELLOW}${time}${COLORS.RESET} : ${arg}${COLORS.RESET} `)
    }
    if (typeof args[args.length - 1] !== 'object') process.stdout.write('\n')
  })
}
