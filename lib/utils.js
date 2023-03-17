import path from 'node:path'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'


const COLORS = { 
  GREEN: '\x1b[32m', RED: '\x1b[31m', YELLOW: '\x1b[33m', DIM: '\x1b[2m', CYAN: '\x1b[36m', GRAY: '\x1b[90m', LIGHTRED: '\x1b[91m', RESET: '\x1b[0m' 
}


export function setGlobals(verbose) {
  global.weboStarted = Date.now()
  global.timeSpent = () => Math.round(10 * (Date.now() - weboStarted) / 1000) / 10
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
