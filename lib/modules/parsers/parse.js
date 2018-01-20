require('jsdom')
require('rollup')

const fs = require('fs')
const bus = require('../bus.js')
const { calcHash } = require('../../utils/utils.js')

bus.attach()

const parsers = fs.readdirSync(`${__dirname}/types/`).reduce((flat, type) => { flat[type.replace('.js', '')] = require('./types/' + type); return flat }, {})

// module.exports.extensions = Object.keys(parsers)


module.exports.parse = async function parse({ file }) {
  // console.log('PARSE', file.filename)
  const { hash } = global.parserOptions
  const parser = parsers[file.type || 'raw'] || parsers['raw']
  await parser(file)
  if (hash && !['html', 'dep'].includes(file.type)) file.hash = await calcHash(file.filename, file.content)
  if (!file.deps) file.deps = []
  return file
}
