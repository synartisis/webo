const path = require('path')
const fs = require('fs')
const sh = require('shelljs')

const state = require('../state')
const loader = require('../loaders/loader')

console.log(state.config)
const src = path.resolve(state.config.srcRoot)
const dest = path.resolve(state.config.destRoot)
console.log({ src, dest })
console.log(state.entries)
console.log(state.deps)

let files = []
files.push(... state.entries)
files.push(... [... state.deps.values()].filter(o => o.ref.endsWith('.html')).map(o => o.path))

console.log(files)

sh.rm('-rf', dest)
// sh.mkdir('-p', dest)

files.forEach(async filename => {
  if (filename.startsWith('http')) return
  const destFilename = path.join(dest, path.relative(src, filename))
  sh.mkdir('-p', path.dirname(destFilename))

  const content = await loader(filename, 'prod')
  if (content) {
    fs.writeFileSync(destFilename, content)
  } else {
    sh.cp(filename, destFilename)
  }
})
