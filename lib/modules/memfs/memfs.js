const path = require('path')
const { globAsync, readFileAsync, logv } = require('../../utils/utils.js')
const { attachWatchers } = require('./watchers.js')
const { startWebSocketServer, webSockets } = require('./webSocketServer.js')
const bus = require('../bus.js')

let files = []
let config = {
  mode: null,
  srcRoot: null,
  parserOptions: null,
}

bus.attach()

async function init({ mode, srcRoot, staticRoots, serverRoot, parserOptions, verbose, watch, webSocketPort }) {
  Object.assign(config, { mode, srcRoot, parserOptions })
  const entries = await globAsync(path.posix.join(srcRoot, `**/*\.html`), { cwd: '.', nodir: true, ignore: ['**/_*'] })
  // console.log(entries)
  await Promise.all(entries.map(async filename => {
    const file = attachFile({ filename, type: filename.split('.').pop() })
    await loadFile(file)
  }))
  // await Promise.all(files.map(file => loadFile(file)))
  // console.log(files.map(file => Object.assign({}, file, { content: !!file.content, deps: file.deps.length })))
  const entriesDeps = files.map(o => o.deps).reduce((flat, depArr) => { Array.isArray(depArr) ? flat.push(...depArr) : null; return flat }, [])
    .filter((v, idx, arr) => arr.findIndex(o => o.filename === v.filename) === idx)
  // console.log(entriesDeps.filter(o => o.filename.endsWith('.js')))
  await Promise.all(entriesDeps.map(async dep => {
    const file = attachFile(dep)
    await loadFile(file)
  }))


  // TODO  2nd level dep detection - maybe loadFile recursive?
  const depsOfDeps = files.map(o => o.deps).reduce((flat, depArr) => { Array.isArray(depArr) ? flat.push(...depArr) : null; return flat }, [])
    .filter((v, idx, arr) => arr.findIndex(o => o.filename === v.filename) === idx)
  // console.log(depsOfDeps.length)
  await Promise.all(depsOfDeps.map(async dep => {
    const file = attachFile(dep)
    await loadFile(file)
  }))

  // console.log(
  //   files
  //   // .filter(o => String(o.type).startsWith('css'))
  //   .filter(o => String(o.type).startsWith('js-'))
  //   // .filter(o => o.filename  === 'src/client/survey/index.html')
  //   .map(file => Object.assign({}, file, { content: file.content && file.content.substring(0, 50) + '...', deps: file.deps.map(o => `${o.filename} - ${o.type}${o.sourceFilename ? ' (' + o.sourceFilename + ')' : ''}`) }))
  // )

  if (watch) enableWatching(srcRoot, serverRoot)
  if (mode === 'dev') startWebSocketServer(webSocketPort)

  await loadExtras(staticRoots)

}


function attachFile(fileProps) {
  // console.log('***', filename, type)
  if (!fileProps.filename) throw new Error(`No filename passed`)
  let file = files.find(o => o.filename === fileProps.filename)
  if (!file) {
    file = Object.assign(fileProps)
    files.push(file)
  } 
  return file
}

function getFile(filename) {
  return files.find(o => o.filename === filename || o.sourceFilename === filename)
}

async function loadFile(file, force) {
  if (file.content && !force) return 
  const parsedFile = await bus.parse(file)
  Object.assign(file, parsedFile)
  
  // console.log('LOADED', Object.assign(file, { content: file.content.substring(0, 20) + '...' }))
}


function enableWatching(srcRoot, serverRoot) {
  attachWatchers(srcRoot, serverRoot, touchFile)
}

async function touchFile(event, filename) {
  logv('_CYAN_' + event, filename)
  let file
  if (event === 'addDir') return
  if (event === 'add') file = attachFile({ filename, type: 'raw' })
  if (event === 'unlink') {
    file = getFile(filename)
    files.splice(files.indexOf(file), 1)
    notifyClients(file)
    return
  }

  if (!file) file = getFile(filename)
  if (!file) return // throw new Error(`touchFile - ${filename} ot found in memfs`)
  file.content = undefined
  await loadFile(file)

  const dependants = files.filter(f => f.deps && f.deps.some(d => d.filename === file.filename))
  // const dependantsOfSameType = dependants.filter(depd => depd.filename.split('.').pop() === file.filename.split('.').pop())
  const dependantsOfSameType = detectDependantsOfType(file, dependants)
  await Promise.all(dependantsOfSameType.map(o => loadFile(o, true)))

  // if (file.filename.includes('_layout.html')) await Promise.all(files.filter(o => o.type === 'html').map(o => loadFile(o, true)))
  // console.log(file)

  notifyClients(file)
}

function notifyClients(file) {
  // process.send({ notifyChanged: path })
  // const ext = path.split('.').pop()
  ;[... webSockets].filter(o => o.readyState === 1).forEach(socket => socket.send(file.type === 'css' ? file.ref : 'refresh'))
  // ;[... webSockets].filter(o => o.readyState === 1).forEach(socket => socket.send(ext === 'css' ? path : 'refresh'))
}

async function getFileContent(filename) {
  const file = files.find(o => o.filename === filename) //getFile(filename)
  return { content: file && file.content }
}

function detectDependantsOfType(file, dependants) {
  return dependants.filter(depd => {
    let typeFile = file.filename.split('.').pop()
    let typeDepd = depd.filename.split('.').pop()
    typeFile = typeMatches[typeFile] || typeFile
    typeDepd = typeMatches[typeDepd] || typeDepd
    return typeFile === typeDepd
  })
}
const typeMatches = {
  'mjs': 'js',
}

async function loadExtras(staticRoots) {
  if (!staticRoots.length) return
  const staticRoot = staticRoots[0]
  if (config.parserOptions.transpile || config.parserOptions.legacy) {
    const babelPolyfillContent = await readFileAsync(require.resolve('babel-polyfill/dist/polyfill.min.js'), 'utf8')
    const weboEnvContent = await readFileAsync(__dirname + '/../../servers/webo/webo-env.min.js', 'utf8')
    attachFile({ 
      filename: staticRoot + '/assets/webo-env.min.js', 
      type: 'raw' ,
      content: [ babelPolyfillContent, weboEnvContent ].join('\n\n')
    })
  }
}

function getFiles() { 
  return files
}

module.exports = {
  init,
  getFiles,
  getFileContent,
}