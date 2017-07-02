const glob = require('glob')
const { promisify } = require('util')
const globAsync = promisify(glob)

const config = require('./config')
const resolve = require('./resolvers/resolve')

let mode = null
const entries = []
const deps = new Map

async function init() {
  const ignore = [...config.exclude, config.destRoot + '/**']
  const discoveredEntries = (await Promise.all(config.include.map(path => globAsync(path, { nodir: true, ignore })))).reduce((flat, o) => flat.push(...o) && flat, [])
  entries.push(... new Set(discoveredEntries))

  const entriesDeps = await resolve(entries)
  entriesDeps.forEach(dep => deps.set(dep.path, dep))
}


module.exports = {
  init,
  mode,
  config,
  deps,
  entries,
}