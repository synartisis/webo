// const { relPath, normalizePath } = require('../utils')
// const htmlFile = require('./filetypes/html')
// const jsFile = require('./filetypes/js')
// const cssFile = require('./filetypes/css')
// const file = require('./filetypes/file')

// const files = []

// function htmlDeps(type) {
//   return files.filter(o => o.ext === 'html').map(html => html.deps).reduce((all, o) => all.push(... o) && all, [])
//     .filter(dep => ['js', 'css'].includes(dep.url.split('.').pop()))
//     .filter(dep => !type || dep.type === type)
// }

// function dependants(path) {
//   path = relPath(path)
//   return files.filter(o => o.deps.some(d => d.path === path))
// }

// function htmlDependants(path, all = []) {
//   dependants(path).filter(o => o.path !== path).forEach(d => {
//     // console.log('=====', d.path)
//     if (d.ext === 'html') 
//       all.push(d)
//     else
//       htmlDependants(d.path, all)
//   })
//   return all
// }

// function attach(path, props) {
//   path = relPath(path)
//   let file = files.find(o => o.path === path)
//   if (!file) {
//     file = createFile(path)
//     Object.assign(file, props)
//     files.push(file)
//   }
//   return file
// }

// function getFile(path) {
//   return files.find(o => o.path === relPath(path))
// }

// function isDirectory(path) {
//   path = relPath(path)
//   return !files.find(o => o.path === path) && !!files.find(o => o.path === path + (path.endsWith('/') ? '' : '/') + 'index.html' )
// }

// function getFileContent(path) {
//   path = relPath(path) + (path.endsWith('/') ? '/' : '')
//   path = path.split('?')[0]
//   const pathsToTry = [ path.endsWith('/') ? path + 'index.html' : path ]
//   // console.log('*',path,pathsToTry)
//   let file = files.find(o => pathsToTry.includes(o.path))
//   if (!file) file = files.find(o => o.path === path)
//   return file && file.content
// }

// function getAsHtmlDep(path) {
//   return htmlDeps().find(b => b.path === path)
// }

// function createFile(path) {
//   const ext = path.split('.').pop()
//   const options = { path, ext }
//   if (ext === 'html') return Object.assign(htmlFile(), options)
//   if (ext === 'js') return Object.assign(jsFile(), options)
//   if (ext === 'css') return Object.assign(cssFile(), options)
//   return Object.assign({}, file(), options)
// }

// function filesFlat() {
//   return files.reduce((flat, f) => { flat[require('path').resolve(f.path)] = f.source; return flat }, {})
//   // return files.reduce((flat, f) => { flat[normalizePath(__dirname + '/' + f.path)] = f.source; return flat }, {})
// }


// module.exports = {
//   files,
//   filesFlat,
//   htmlDeps,
//   attach,
//   getFile,
//   dependants,
//   htmlDependants,
//   getFileContent,
//   isDirectory,
//   getAsHtmlDep,
// }