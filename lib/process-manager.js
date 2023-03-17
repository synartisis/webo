import { fork } from 'node:child_process'
import { parse } from '../parsers/parser.js'

const __dirname = new URL('.', import.meta.url).pathname
let userProc
let userProcArgs

export function createUserProcess(userEntry, nodeArgs, config) {
  userProcArgs = [ userEntry, nodeArgs, config ]
  userProc = fork(__dirname + '/../userProcess/userHost.js', [ userEntry, config.projectType ], { execArgv: nodeArgs ? nodeArgs.split(' ') : null, env: { NODE_OPTIONS: '--experimental-modules' } })
  logv(`_CYAN_[ user process ${userProc.pid} ${userEntry} ]_RESET_`)
  userProc.on('exit', exitcode => { if (exitcode) process.exit(exitcode) })
  userProc.on('message', async ({ id, path }) => {
    const { content } = await parse(path, config)
    userProc.send({ id, path, content })
    // try {
    //   let { content } = await parse(path, config)
    //   userProc.send({ id, path, content })
    // } catch (error) {
    //   log('_RED_Parser Error', error)
    //   userProc.send({ id, error: error.stack || error.toString(), errorCode: error.code })
    // }
  })
  if (process.listenerCount('exit') > 0) process.removeListener('exit', exitListener)
  process.on('exit', exitListener)
  return userProc
}

export function restartUserProcess() {
  userProc.kill()
  userProc = createUserProcess(...userProcArgs)
}

function exitListener() {
  userProc.kill()
}