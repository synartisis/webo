import path from 'node:path'

import fs from'fs/promises'
import { readdirp } from'../lib/fs-utils.js'
import { relativePath } from'../lib/utils.js'
import { parse } from'../parsers/parser.js'
import { files } from'../parsers/files.js'
import { parsable } from'../webo-settings.js'

const destFilenames = []
const serverFiles = []

export default async function build(config) {

  if (!config.output) return { exitCode: 1, message: 'output is not defined' }
  if (!config.serverRoots.length) return { exitCode: 1, message: 'serverRoots not defined' }
  if (!config.clientRoots.length) return { exitCode: 1, message: 'clientRoots not defined' }

  const dest = path.resolve(config.output)
  await fs.mkdir(dest, { recursive: true })
  const srcRoots = [ ...config.serverRoots, ...config.clientRoots ]
  const destFilenamesOrig = await readdirp(dest, { type: 'file' })

  const srcFiles = []


  // client files
  await Promise.all(
    config.clientRoots.map(async srcRoot => srcFiles.push(... await readdirp(srcRoot, { type: 'file' })))
  )

  // parse html files
  await Promise.all(
    srcFiles.filter(o => o.endsWith('.html') && parsable(o)).map(srcFile => parse(srcFile, config, { cacheContent: true }))
  )
  logv(`_GRAY_${srcFiles.filter(o => o.endsWith('.html') && parsable(o)).length} html files parsed at ${timeSpent()}s`)

  // parse module entries
  await Promise.all(
    Object.keys(files).filter(k => files[k].type === 'js-module').map(k => parse(k, config, { cacheContent: true }))
  )

  // parse rest parsable files
  await Promise.all(
    srcFiles.filter(o => parsable(o) && !(files[o] && files[o].content)).map(srcFile => parse(srcFile, config, { cacheContent: true }))
  )

  // parse virtual files
  await Promise.all(
    Object.keys(files).filter(k => !files[k].content && parsable(k)).map(k => parse(k, config, { cacheContent: true }))
  )


  logv(`_GRAY_copying files...`)
  // copy parsable files
  await Promise.all(
    Object.entries(files).map(async ([k ,v]) => {
      if (['dev-dep'].includes(v.type)) return
      const destFilename = resolveDestPath(k, srcRoots, dest)
      return copy(k, destFilename, v.content)
    })
  )

  // add server files
  await Promise.all(
    config.serverRoots.map(async srcRoot => {
      serverFiles.push(... await readdirp(srcRoot, { type: 'file' }))
      srcFiles.push(... serverFiles)
    })
  )

  // copy non parsable files
  await Promise.all(
    srcFiles.filter(k => serverFiles.includes(k) || !(k in files)).map(async k => {
      const destFilename = resolveDestPath(k, srcRoots, dest)
      return copy(k, destFilename)
    })
  )

  // npm files
  await copy(path.resolve('package.json'), path.join(dest, 'package.json'))
  await copy(path.resolve('package-lock.json'), path.join(dest, 'package-lock.json'))

  // remove extraneous
  await Promise.all(
    destFilenamesOrig.map(async f => {
      if (!destFilenames.includes(f) && !serverFiles.includes(f)) {
        log(`_GRAY_remove extraneous ${relativePath(f)}`)
        await fs.unlink(f)
        try {
          const dir = path.dirname(f)
          if ((await readdirp(dir, { type: 'file' })).length === 0) {
            await fs.rmdir(dir)
            log(`_GRAY_remove empty dir ${relativePath(dir)}`)
          }
        } catch (error) {}
      }
    })
  )

  if (config.debug) console.log(Object.keys(files).map(k => `${k.split('/').pop()} ${files[k].type} ${files[k].parseCount}`))

  return `build to '${config.output}' succeeded at ${Math.round(10 * (Date.now() - weboStarted) / 1000) / 10}s`
  
}


async function copy(srcPath, destPath, content) {
  destFilenames.push(destPath)
  let srcBuffer, destBuffer
  if (content) {
    srcBuffer = Buffer.from(content)
  } else {
    try {
      srcBuffer = await fs.readFile(srcPath)
    } catch (error) { srcBuffer = Buffer.from('*EMPTY_SRC*') }
  }
  try {
    destBuffer = await fs.readFile(destPath)
  } catch (error) { destBuffer = Buffer.from('*EMPTY_DEST*') }
  if (!srcBuffer.equals(destBuffer)) {
    await fs.mkdir(path.dirname(destPath), { recursive: true })
    if (srcBuffer.equals(Buffer.from('*EMPTY_SRC*'))) {
      await fs.copyFile(srcPath, destPath)
    } else {
      await fs.writeFile(destPath, srcBuffer)
    }
    log(`_GRAY_${relativePath(destPath)}`)
  }
}

function resolveDestPath(srcPath, srcRoots, destRoot) {
  const srcRoot = srcRoots.find(r => srcPath.startsWith(r))
  if (!srcRoot) return log(`_RED_${srcPath} not found`)
  const relPath = path.relative(srcRoot, srcPath)
  const dirname = srcRoot.replace(/\\/g, '/').split('/').pop()
  return path.join(destRoot, dirname, relPath)
}