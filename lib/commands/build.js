import path from 'node:path'

import { promises as fs} from'node:fs'
import { readdirp } from'../utils/utils.js'
import { relativePath } from'../utils/utils.js'
import { parse } from'../parsers/parser.js'
import { files } from'../parsers/files.js'
import { parsable } from'../utils/utils.js'

/** @type {string[]} */
const destFilenames = []
/** @type {string[]} */
const serverFiles = []

/** @type {(config: Webo.Config) => Promise<Webo.CommandResult>} */
export default async function build(config) {

  if (!config.output) return { exitCode: 1, message: 'output is not defined' }
  if (!config.serverRoots.length) return { exitCode: 1, message: 'serverRoots not defined' }
  if (!config.clientRoots.length) return { exitCode: 1, message: 'clientRoots not defined' }

  const buildStarted = Date.now()

  const dest = path.resolve(config.output)
  await fs.mkdir(dest, { recursive: true })
  const srcRoots = [ ...config.serverRoots, ...config.clientRoots ]
  const destFilenamesOrig = await readdirp(dest, 'file')

  /** @type {string[]} */
  const srcFiles = []


  // client files
  await Promise.all(
    config.clientRoots.map(async srcRoot => srcFiles.push(... await readdirp(srcRoot, 'file')))
  )

  // parse html files
  await Promise.all(
    srcFiles.filter(o => o.endsWith('.html')).map(srcFile => parse(srcFile, config, { cacheContent: true }))
  )
  logv(`_GRAY_${srcFiles.filter(o => o.endsWith('.html')).length} html files parsed`)

  // parse module entries
  await Promise.all(
    Object.keys(files).filter(k => files[k].type === 'js-module').map(k => parse(k, config, { cacheContent: true }))
  )

  // parse rest parsable files
  await Promise.all(
    srcFiles.filter(o => parsable(o) && !files[o]?.content).map(srcFile => parse(srcFile, config, { cacheContent: true }))
  )

  // parse virtual files
  await Promise.all(
    Object.keys(files).filter(k => parsable(k) && !files[k].content).map(k => parse(k, config, { cacheContent: true }))
  )


  logv(`_GRAY_copying files...`)
  // copy parsable files
  await Promise.all(
    Object.entries(files).map(async ([k ,v]) => {
      if (v?.type === 'dev-dep') return
      const destFilename = resolveDestPath(k, srcRoots, dest)
      return copy(k, destFilename, v.content)
    })
  )
  logv(`_GRAY_  parsable files copied`)

  // add server files
  await Promise.all(
    config.serverRoots.map(async srcRoot => {
      const filesUnderRoot = await readdirp(srcRoot, 'file')
      serverFiles.push(... filesUnderRoot)
      srcFiles.push(... filesUnderRoot)
    })
  )
  logv(`_GRAY_  server files copied`)

  // copy non parsable files
  await Promise.all(
    srcFiles.filter(k => serverFiles.includes(k) || !(k in files)).map(async k => {
      if (excludeFile(k)) return
      const destFilename = resolveDestPath(k, srcRoots, dest)
      return copy(k, destFilename)
    })
  )
  logv(`_GRAY_  non parsable files copied`)

  // npm files
  await copy(path.resolve('package.json'), path.join(dest, 'package.json'))
  await copy(path.resolve('package-lock.json'), path.join(dest, 'package-lock.json'))
  logv(`_GRAY_  npm files copied`)

  // remove extraneous
  await Promise.all(
    destFilenamesOrig.map(async f => {
      if (!destFilenames.includes(f) && !serverFiles.includes(f)) {
        log(`_GRAY_remove extraneous ${relativePath(f)}`)
        await fs.unlink(f)
        try {
          const dir = path.dirname(f)
          if ((await readdirp(dir, 'file')).length === 0) {
            await fs.rmdir(dir)
            log(`_GRAY_remove empty dir ${relativePath(dir)}`)
          }
        } catch (error) {}
      }
    })
  )

  if (config.debug) {
    log('_YELLOW_\nDEBUG: _RESET_ "filename type parseCount"\n_GRAY_' + 
      Object.keys(files).map(k => `${k.split('/').pop()} ${files[k].type} _RESET_${files[k].parseCount}_GRAY_`).join('\n')
    )
  }

  const buildResult = `build to '${config.output}' succeeded at ${Math.round(10 * (Date.now() - buildStarted) / 1000) / 10}s`
  log(`_GREEN_${buildResult}`)
  return { exitCode: 0, message: buildResult }  
  // return `build to '${config.output}' succeeded at ${Math.round(10 * (Date.now() - buildStarted) / 1000) / 10}s`
  
}


/** @type {(srcPath: string, destPath: string, content?: string) => Promise<void>} */
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

/** @type {(srcPath: string, srcRoots: string[], destRoot: string) => string} */
function resolveDestPath(srcPath, srcRoots, destRoot) {
  const srcRoot = srcRoots.find(r => srcPath.startsWith(r))
  if (!srcRoot) { log(`_RED_${srcPath} not found`); return '' }
  const relPath = path.relative(srcRoot, srcPath)
  const dirname = srcRoot.replace(/\\/g, '/').split('/').pop() ?? ''
  return path.join(destRoot, dirname, relPath)
}


/** @type {(filename: string) => boolean} */
function excludeFile(filename) {
  if (['tsconfig.json', 'jsconfig.json'].includes(path.basename(filename))) return true
  return false
}