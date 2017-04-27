// const glob = require('glob')
// const watcher = require('../watchers/clientWatcher')
// const { normalizePath, relPath } = require('../utils')
// const files = require('./files')

// let config = require('../config')
// const roots = []
// const rootsPending = new Set


// async function loadDirectory(root) {
//   root = normalizePath(root)
//   const added = addRoot(relPath(root))
//   if (added) {
//     rootsPending.add(root)
//     const paths = glob.sync(root + '/**/*', { nodir: true })
//     const htmlPaths = paths.filter(o => o.endsWith('.html'))
//     const htmlFiles = await Promise.all(htmlPaths.map(path => files.attach(path).load()))
//     const jsDeps = new Map
//     htmlFiles.forEach(html => html.deps.filter(dep => dep.path.endsWith('.js')).forEach(dep => { jsDeps.set(dep.path, dep) }))
//     // await Promise.all(
//     //   [... jsDeps.values()].map(async dep => !files.getFile(dep.path) ? await Object.assign(files.attach(dep.path), { type: dep.type }) : Promise.resolve())
//     // )

// console.log('*** load ', root, new Date().toISOString())
// const ff = await Promise.all(
//     paths.filter(path => path.endsWith('.js')).map(path => new Promise((resolve, reject) => require('fs').readFile(path, 'utf8', (err, data) => err ? reject(err) : resolve({ path, source: data }))))
// )
// console.log(ff.map(o => o.path))
// ff.map(f => files.attach(f.path, { source: f.source, type: (files.getAsHtmlDep(f.path) ? files.getAsHtmlDep(f.path).type : null) }))
// console.log('*** load ends ', root, ff.length, new Date().toISOString())

//   // files.getFile('src/client/landing/index.js').type = 'module'

//     // await Promise.all(
//     //   files.files.map(f => f.load())
//     // )


//     rootsPending.delete(root)
//   }
//   return added
// }


// async function ready() {
//   return new Promise(resolve => {
//     const interval = setInterval(() => {
//       if (!roots.length || rootsPending.size === 0) {
//         clearInterval(interval)
//         resolve()
//       }
//     }, 300)
//   })
// }


// function addRoot(root) {
//   let narrowerRoot = roots.findIndex(r => r && r.startsWith(root))
//   if (narrowerRoot !== -1) roots.splice(narrowerRoot, 1, root)
//   if (!roots.find(r => root.startsWith(r))) {
//     roots.push(root)
//     return true
//   }
//   return false
// }



// module.exports = {
//   files: files.files,
//   roots,
//   ready,
//   loadDirectory,
//   getFileContent: files.getFileContent,
//   isDirectory: files.isDirectory,
// }