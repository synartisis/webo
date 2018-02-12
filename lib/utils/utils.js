const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { promisify } = require('util')
const glob = require('glob')
const mime = require('mime')

const COLORS = module.exports.COLORS = { 
  GREEN: '\x1b[32m', RED: '\x1b[31m', YELLOW: '\x1b[33m', DIM: '\x1b[2m', CYAN: '\x1b[36m', GRAY: '\x1b[90m', LIGHTRED: '\x1b[91m', RESET: '\x1b[0m' 
}


module.exports.relPath = to => path.relative(path.resolve('.'), to).replace(/\\/g, '/')

module.exports.calcAssetPath = (referrer, relUrl) => path.relative('.' , path.posix.resolve(path.dirname(referrer), relUrl.split('?')[0])).replace(/\\/g, '/')

module.exports.rewritePath = (oldRef, newRef, rel) => {
  const oldDir = path.dirname(oldRef)
  const newDir = path.dirname(newRef)
  const relativePath = path.relative(newDir, oldDir)
  return path.posix.join(relativePath, rel)
}

module.exports.globAsync = promisify(glob)

module.exports.lstatAsync = promisify(fs.lstat)

module.exports.readFileAsync = promisify(fs.readFile)

module.exports.mkdirAsync = promisify(fs.mkdir)

module.exports.execAsync = promisify(require('child_process').exec)

module.exports.isDirectory = async path => {
  try {
    const stat = await module.exports.lstatAsync(path)
    return stat.isDirectory()
  } catch (error) {
    return false
  }
}

module.exports.getMimeType = filename => mime.getType(filename.split('.').pop()) || 'application/octet-stream'

module.exports.log = (...args) => {
  const colorKeys = Object.keys(COLORS)
  const colored = []
  args = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).filter(o => String(o).length > 0)
  let argsStr = args.join('___')
  colorKeys.forEach(clr => argsStr = argsStr.replace(new RegExp(`_${clr}_`, 'g'), COLORS[clr]))
  const time = new Date().toISOString().split('T').pop().substring(3)
  console.log(`${COLORS.YELLOW}${time}${COLORS.RESET} :`, ...argsStr.split('___'), COLORS.RESET)
}

module.exports.logv = (...args) => {
  if (global.options && global.options.verbose) module.exports.log(...args)
}

module.exports.calcHash = async (filename, content, length = 6) => {
  if (!content) content = await module.exports.readFileAsync(filename)
  const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, length)
  return hash
  // return new Promise((resolve, reject) => {
  //   const hash = crypto.createHash('sha1')
  //   hash.setEncoding('hex')
  //   if (content) {
  //     hash.update(content)
  //     resolve(hash.digest('hex').substring(0, length))
  //   } else {
  //     const stream = fs.createReadStream(filename)
  //     stream.on('error', err => reject(err))
  //     stream.on('data', chunk => hash.update(chunk))
  //     stream.on('end', () => resolve(hash.digest('hex').substring(0, length)))
  //   }
  // })
}

module.exports.removeHash = (filename, length = 6) => {
  const ext = filename.split('.').pop()
  const hashPlaceholder = filename.substring(filename.length - ext.length - 1 - 6, filename.length - ext.length - 1)
  const isHex  = /^[0-9A-F]{6}$/i.test(hashPlaceholder)
  return isHex ? filename.replace('-' + hashPlaceholder, '') : filename

  return filename.substring(0, filename.length - length - ext.length - 1) + '.' + ext
}
