const path = require('path')
const semver = require('semver')
const fs = require('fs')
const { promisify } = require('util')
const glob = require('glob')

const { state } = require('./state')
const { engines } = require('../package.json')


module.exports.resolvePath = inputPath => path.relative(state.config.srcRoot, path.resolve(inputPath)).replace(/\\/g, '/')

module.exports.readFileAsync = promisify(fs.readFile)

module.exports.lstatAsync = promisify(fs.lstat)

module.exports.globAsync = promisify(glob)

module.exports.checkVersion = () => {
  if (!semver.satisfies(process.version, engines.node)) {
    console.error(`You need to install node.js version ${engines.node}`)
    process.exit(1)
  }
}
