const glob = require('glob')
const watcher = require('./watcher')
const { normalizePath, relPath } = require('./utils')
const files = require('./files')

let config = require('../config')
const roots = []



async function loadDirectory(root) {
  root = normalizePath(root)
  const paths = glob.sync(root + '/**/*', { nodir: true })
  const added = addRoot(relPath(root))
  if (added) {
    const htmlPaths = paths.filter(o => o.endsWith('.html'))
    const htmlFiles = await Promise.all(htmlPaths.map(path => files.attach(path).load()))
    // htmlFiles.forEach(html => html.deps.filter(o => o.url.endsWith('.js') && o.webo === 'module').forEach(dep => files.bundleRoots.push(dep.path)))
      // .forEach(dep => dep.webo === 'module' ? files.bundleRoots.push(dep.path) : Object.assign(files.attach(dep.path).load(), {raw:true})))
    // await Promise.all(files.bundleRoots.map(path => files.attach(path).load({ config })))
    if (config.vendorFilename) {
      htmlFiles.forEach(html => {
        const depModules = html.deps.filter(o => o.url.endsWith('.js') && o.webo === 'module').map(o => files.getFile(o.path))
        const vendors = new Map
        depModules.forEach(o => o.vendor.forEach((v ,k) => k ? vendors.set(k, v) : null))
        if (vendors.size) {
          const vendorFile = files.attach(html.dirname() + '/' + config.vendorFilename.replace(/\.js$/, '') + '.js')
          vendorFile.content = [... vendors.values()].join('\n\n/* webo MODULE */\n\n')
          // vendorFile.deps.push(... depModules.map(o => { return { path: o.path } }))
        }
      })
    }
    watcher.watchDirectory(root, files, config)
  }
}













function addRoot(root) {
  let narrowerRoot = roots.findIndex(r => r && r.startsWith(root))
  if (narrowerRoot !== -1) roots.splice(narrowerRoot, 1, root)
  if (!roots.find(r => root.startsWith(r))) {
    roots.push(root)
    return true
  }
  return false
}


module.exports = {
  files: files.files,
  roots,
  loadDirectory,
  getFileContent: files.getFileContent,
}