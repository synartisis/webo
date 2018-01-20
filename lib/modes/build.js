const bus = require('../modules/bus.js')
const { globAsync, mkdirAsync, logv } = require('../utils/utils.js')
const fs = require('fs')
const path = require('path')

function hashFilename(filename, hash) {
  const ending = "." + filename.split('.').pop()
  return filename.replace(ending, '-' + hash + ending)
}

module.exports = async function build({ type, entry, srcRoot, staticRoots, serverRoot, parserOptions }) {
  
  await bus.memfsInit({ mode: 'build', srcRoot, staticRoots, parserOptions, watch: false })
  // await bus.rpc('memfs', { init: { mode: 'build', srcRoot, staticRoots, parserOptions, watch: false, webSocketPort: 0 } })
  
  const distRoot = 'dist/'
  await rimrafDist(distRoot)
  
  // console.log('build', {type, entry, srcRoot, staticRoots, parserOptions})
  
  let files = await bus.getFiles()
  // let files = await bus.rpc('memfs', { getFiles: { a: 1} })
  files = files.filter(o => o.type !== 'dep')
  logv(`memfs loaded (${files.length} files)`)

// console.log(files.map(o => Object.assign({}, o, { content: !!o.content })))

  if (parserOptions.hash) {
    // apply hashes
    files.filter(o => ['html', 'css'].includes(o.type)).forEach(file => {
      if (!file.deps) return
      file.deps.forEach(dep => {
        const depFile = files.find(o => o.filename === dep.filename)
        if (!depFile) return
        file.content = file.content.replace(new RegExp(dep.ref, 'g'), hashFilename(dep.ref, depFile.hash))
      })
    })
  }

  await Promise.all(
    files.map(async file => {
      let destFilename = file.filename.replace(srcRoot, distRoot)
      const destDirname = path.dirname(destFilename)
      if (parserOptions.hash && file.hash) {
        destFilename = hashFilename(destFilename, file.hash)
      }
      // console.log({filename,destFilename,destDirname})
      mkdirp(destDirname)
      if (file.content) {
        fs.writeFileSync(destFilename, file.content)
      } else {
        fs.copyFileSync(file.filename, destFilename)
      }
    })
  )
  logv(`memfs files copied to ${distRoot}`)

  if (type === 'express') {
    const serverFiles = await globAsync(serverRoot + '/**', { nodir: true })
    serverFiles.forEach(filename => {
      let destFilename = filename.replace(srcRoot, distRoot)
      const destDirname = path.dirname(destFilename)
      mkdirp(destDirname)
      fs.copyFileSync(filename, destFilename)
    })
    const npmFiles = await globAsync('package*.json')
    npmFiles.forEach(filename => {
      let destFilename = distRoot + filename
      fs.copyFileSync(filename, destFilename)
    })
    logv(`server files copied to ${distRoot}`)
  }

}


function mkdirp(dir, mode){
  try {
    fs.mkdirSync(dir, mode)
  } catch(err) {
    switch (err.code) {
      case 'ENOENT':
        mkdirp(path.dirname(dir), mode)
        mkdirp(dir, mode)
        break
      case 'EEXIST':
        break
      default:
        throw err
    }
  }
}

async function rimrafDist(dist) {
  const distFiles = await globAsync(dist + '/**', { nodir: true })
  distFiles.forEach(df => fs.unlinkSync(df))
  const distDirs = await globAsync(dist + '/**')
  distDirs.sort((a, b) => a < b ? 1 : -1).forEach(dr => fs.rmdirSync(dr))
}