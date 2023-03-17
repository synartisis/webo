const { fork } = require('child_process')
const { parse } = require('../parsers/parser.js')

let userProc
let userProcArgs

exports.createUserProcess = function createUserProcess(userEntry, nodeArgs, config) {
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

exports.restartUserProcess = function restartUserProcess() {
  userProc.kill()
  userProc = exports.createUserProcess(...userProcArgs)
}

function exitListener() {
  userProc.kill()
}