import * as cp from 'node:child_process'
import { parse } from '../parsers/parser.js'

const __dirname = new URL('.', import.meta.url).pathname
/** @type {cp.ChildProcess} */
let userProc
/** @type {[userEntry: string, nodeArgs: string, config: Webo.Config]} */
let userProcArgs


/** @type {(userEntry: string, nodeArgs: string, config: Webo.Config) => cp.ChildProcess} */
export function createUserProcess(userEntry, nodeArgs, config) {
  userProcArgs = [ userEntry, nodeArgs, config ]
  userProc = cp.fork(
    __dirname + 'userProcess/userHost.js', 
    [ userEntry, config.projectType ?? '' ], 
    { execArgv: nodeArgs ? nodeArgs.split(' ') : undefined }
  )
  logv(`_CYAN_[ user process ${userProc.pid} ${userEntry} ]_RESET_`)
  // @ts-ignore
  userProc.on('message', async ({ id, path, error }) => {
    if (error) return onProcessError(error)
    const { content } = await parse(path, config)
    userProc.send({ id, path, content })
  })
  process.on('exit', onProcessExit)
  return userProc
}

export function restartUserProcess() {
  onProcessExit()
  userProc = createUserProcess(...userProcArgs)
}

function onProcessExit() {
  process.removeListener('exit', onProcessExit)
  userProc.kill()
}

/** @type {(message: string) => void} */
function onProcessError(message) {
  log(`_RED_${message}`)
}