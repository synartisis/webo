const fs = require('fs')
const path = require('path')
const sh = require('shelljs')
const glob = require('glob')

const { relPath } = require('../utils')

function copy(config, context, roots, files) {
  const { dest, srcRoot, paths } = config
  const assets = roots.map(root => glob.sync(context + '/' + root + '/**/*', { nodir: true }))
    .reduce((all, o) => all.push(... o) && all, [])
    .map(o => o.replace(context + '/', ''))
  const dynamic = files.filter(o => o.built) // && !o.path.endsWith('/vendor.js'))
  const static = assets.filter(asset => !['html', 'css', 'js'].includes(asset.split('.').pop())).filter(asset => {
    const inFiles = files.find(o => o.path === asset)
    if (!inFiles) return true
    return !inFiles.built || !inFiles.built.hash
  })

  sh.rm('-rf', dest)
  copyStatic(static, dest, srcRoot)
  copyPaths(paths, dest, context)
  copyServerModules(srcRoot, dest)
  copyDynamic(dynamic, dest, srcRoot)
  // createVendorFiles(files, dest, srcRoot)
}

function copyStatic(static, dest, srcRoot) {
  static.forEach(filePath => {
    const destPath = dest + '/' + filePath.replace(srcRoot + '/', '')
    sh.mkdir('-p', path.dirname(destPath))
    sh.cp(filePath, destPath)
  })
}

function copyPaths(paths, dest, context) {
  for (const [from, to] of Object.entries(paths)) {
    const destPath = context + '/' + dest + '/' + to
    sh.cp('-R', from, destPath)
  }
}

function copyServerModules(srcRoot, dest) {
  const modules = Object.keys(require.cache).filter(o => !o.includes('node_modules')).map(relPath).filter(o => !o.includes('/webo/'))
  modules.forEach(srcPath => {
    const destPath = srcPath.replace(srcRoot, dest)
    sh.mkdir('-p', path.dirname(destPath))
    sh.cp(srcPath, destPath)
  })
}

function copyDynamic(dynamic, dest, srcRoot) {
  dynamic.forEach(file => {
    const destPath = dest + '/' + (file.built.path || file.path).replace(srcRoot + '/', '')
    sh.mkdir('-p', path.dirname(destPath))
    if (file.built.content) {
      fs.writeFileSync(destPath, file.built.content)
    } else {
      sh.cp(file.path, destPath)
    }
  })
}

function createVendorFiles(files, dest, srcRoot) {
  files.filter(o => o.ext === 'html' && o.built.vendorHash).forEach(file => {
    const destPath = path.dirname(dest + '/' + file.path.replace(srcRoot + '/', '')) + '/vendor-' + file.built.vendorHash + '.js'
    const vendorFile = files.find(o => o.path === path.dirname(file.path) + '/vendor.js')
    fs.writeFileSync(destPath, file.built.vendor + '\n\n' + vendorFile.built.content)
  })
}


module.exports = copy