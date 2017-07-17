const path = require('path')
const semver = require('semver')
const fs = require('fs')
const crypto = require('crypto')
const { promisify } = require('util')
const glob = require('glob')

const { state } = require('./state')
const { engines } = require('../package.json')


// module.exports.resolvePath = inputPath => path.relative(state.config.srcRoot || '.', path.resolve(inputPath)).replace(/\\/g, '/')

module.exports.readFileAsync = promisify(fs.readFile)

module.exports.lstatAsync = promisify(fs.lstat)

module.exports.globAsync = promisify(glob)

module.exports.checkVersion = () => {
  if (!semver.satisfies(process.version, engines.node)) {
    console.error(`You need to install node.js version ${engines.node}`)
    process.exit(1)
  }
}

module.exports.calcHash = async (filename, length = 6) => {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filename)
    const hash = crypto.createHash('sha1')
    hash.setEncoding('hex')
    stream.on('error', err => reject(err))
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex').substring(0, length)))
  })
}

module.exports.injectHash = (filename, hash) => {
  let parts = filename.split('.')
  if (parts.length < 2) return filename
  parts[parts.length - 2] += '-' + hash
  return parts.join('.')
}

module.exports.resolvePath = (referrer, rel) => {
  if (rel.startsWith('/')) {
    return state.config.srcRoot + rel
  } else {
    return path.relative('.' , path.resolve(path.dirname(referrer), rel.split('?')[0])).replace(/\\/g, '/')
  }
}