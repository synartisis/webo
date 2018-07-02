const bus = require('../modules/bus.js')
const { globAsync, log, logv, calcHash } = require('../utils/utils.js')
const fs = require('fs')
const path = require('path')

function hashFilename(filename, hash) {
  const ending = "." + filename.split('.').pop()
  return filename.replace(ending, '.' + hash + ending)
}

module.exports = async function build({ type, entry, srcRoot, staticRoots, serverRoot, parserOptions }) {
  
  await bus.memfsInit({ mode: 'build', srcRoot, staticRoots, parserOptions, watch: false })
  // await bus.rpc('memfs', { init: { mode: 'build', srcRoot, staticRoots, parserOptions, watch: false, webSocketPort: 0 } })
  
  const distRoot = 'dist/'
  const distFiles = await globAsync(`${distRoot}**`, { nodir: true })
  const copied = []
  // await rimrafDist(distRoot)
  
  // console.log('build', {type, entry, srcRoot, staticRoots, parserOptions})
  
  const memfsFiles = await bus.getFiles()
  // let files = await bus.rpc('memfs', { getFiles: { a: 1} })
  const files = memfsFiles.filter(o => o.type !== 'dep')
  logv(`memfs loaded (${files.length} files)`)


  if (parserOptions.hash) {
    // apply hashes
    await Promise.all(
      files.filter(o => o.content).map(file => {
        if (!file.deps) return
        return file.deps.map(async dep => {
          const depFile = files.find(o => o.filename === dep.filename)
          if (!depFile) return
          if (!depFile.hash) depFile.hash = await calcHash(depFile.filename, depFile.content)
          file.content = file.content.replace(new RegExp(dep.ref, 'g'), hashFilename(dep.ref, depFile.hash))
        })
      })
    )
  }
  // console.log(files.filter(o => o.filename.endsWith('.css')).map(o => Object.assign({}, o, { content: !!o.content, deps: o.deps && o.deps.length })))

  await Promise.all(
    files.map(async file => {
      let destFilename = file.filename.replace(srcRoot, distRoot)
      if (parserOptions.hash && file.hash) {
        destFilename = hashFilename(destFilename, file.hash)
      }
      // console.log({filename,destFilename,destDirname})
      return copyFile(file.filename, destFilename, file.content, distFiles, copied)

      // mkdirp(destDirname)
      // copied.push(destFilename)
      // if (file.content) {
      //   fs.writeFileSync(destFilename, file.content)
      // } else {
      //   fs.copyFileSync(file.filename, destFilename)
      // }
    })
  )
  logv(`memfs files copied to ${distRoot}`)

  const staticFiles = (await Promise.all(
    staticRoots.map(staticRoot => staticRoot + '/**').map(staticGlob => globAsync(staticGlob, { nodir: true }))
  )).reduce((flat, arr) => { flat.push(...arr); return flat }, [])

  const extraStaticFiles = staticFiles.filter(ef => !memfsFiles.find(o => o.filename === ef))
  await Promise.all(
    extraStaticFiles.map(filename => {
      let destFilename = filename.replace(srcRoot, distRoot)
      log('_GRAY_extra file copied:', filename)
      return copyFile(filename, destFilename, null, distFiles, copied)
    })
  )


  if (type === 'express') {
    const serverFiles = await globAsync(serverRoot + '/**', { nodir: true })
    await Promise.all(
      serverFiles.map(filename => {
        let destFilename = filename.replace(srcRoot, distRoot)
        return copyFile(filename, destFilename, null, distFiles, copied)
      })
    )
    const npmFiles = await globAsync('package*.json')
    await Promise.all(
      npmFiles.map(filename => {
        let destFilename = distRoot + filename
        return copyFile(filename, destFilename, null, distFiles, copied)
      })
    )
    logv(`server files copied to ${distRoot}`)
  }

  // remove extra files

  // console.log(copied.filter(o => !['png', 'jpg', 'svg'].includes(o.split('.').pop())))
  distFiles.forEach(distFilename => {
    if (!copied.includes(distFilename)) {
      fs.unlinkSync(distFilename)
      // console.log('REMOVE', distFilename)
    }
  })

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

function unhashFilename(filename) {
  const bare = filename.split('/').pop()
  const parts = bare.split('.')
  if (parts.length < 3) return filename
  const potentialHash = parts[parts.length - 2]
  const isHashed = /[0-9a-fA-F]{6}/.test(potentialHash)
  if (!isHashed) return filename
  return parts.filter(o => o !== potentialHash).join('.')
}

async function copyFile(srcFilename, destFilename, content, distFiles, copied) {
  const srcHash = await calcHash(srcFilename, content)
  const distHash = distFiles.includes(destFilename) ? await calcHash(destFilename) : null
  copied.push(destFilename)
  if (srcHash !== distHash) {
    const destDirname = path.dirname(destFilename)
    mkdirp(destDirname)
    if (content) {
      fs.writeFileSync(destFilename, content)
    } else {
      fs.copyFileSync(srcFilename, destFilename)
    }
  }
}