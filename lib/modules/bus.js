const { fork, attach, rpc, send } = require('./process-manager.js')


function init() {
  attach({ exports: require('../main-api.js') })
  const cpus = require('os').cpus().length
  fork('memfs', `${__dirname}/memfs/memfs.js`, { globals: { options } })
  fork('parsers', `${__dirname}/parsers/parse.js`, { globals: { options }, numOfProcesses: 1 }) // removed multiple procs because of locking issue
}

function setGlobals(mode, srcRoot, options, parserOptions) {
  const glboalsMessage = { type: 'globals', globals: { options: Object.assign({}, options, { mode, srcRoot }) , parserOptions } }
  send(glboalsMessage, 'memfs', true)
  send(glboalsMessage, 'parsers', true)
}

async function memfsInit({ mode, srcRoot, staticRoots, serverRoot, parserOptions, watch = false, webSocketPort = 0 }) {
  const result = await rpc('memfs', 'init', [{ mode, srcRoot, staticRoots, serverRoot, parserOptions, watch, webSocketPort }])
  return result
}

async function getFileContent(filename) {
  const result = await rpc('memfs', 'getFileContent', [ filename ])
  return result.content
}

async function getFiles() {
  let files = await rpc('memfs', 'getFiles')
  return files
}

async function parse(file) {
  // console.log('PARSE', moduleName, file.filename)
  const parsedFile = await rpc('parsers', 'parse', [{ file }])
  // console.log('PARSED', moduleName, file.filename)
  return parsedFile
}

async function restartServer() {
  return await rpc('main', 'restartServer')
}



module.exports = {
  init,
  attach,
  setGlobals,
  memfsInit,
  getFiles,
  getFileContent,
  parse,
  restartServer,
}