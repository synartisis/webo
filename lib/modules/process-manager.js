const cp = require('child_process')
const utils = require('../utils/utils.js')

const forkedModules = new Map
const pending = new Map

let moduleName = 'main'
let apiModule = { exports: null }

function attach(processApiModule = require.main) {
  process.addListener('uncaughtException', err => {
    if (err.code === 'ECONNRESET' && process.platform === 'win32') return // HACK - shadow ECONNRESET error on win32
    if (err.code === 'ERR_IPC_CHANNEL_CLOSED') return process.exit(1) // Error thrown in subprocess
    throw err
  })
  process.addListener('unhandledRejection', (r, p) => utils.log('_RED_', r, r.stack))
  const pmArgsString = process.argv.pop()
  if (pmArgsString.startsWith('[PM_ARGS]')) {
    // child process
    const pmArgs = JSON.parse(pmArgsString.replace('[PM_ARGS]', ''))
    moduleName = pmArgs.name
    apiModule = processApiModule
    Object.assign(global, pmArgs.globals)
    utils.logv(`${utils.COLORS.GRAY}attaching process ${moduleName}`)
    process.addListener('unhandledRejection', (r, p) => p.catch(o => { utils.log('_RED_', o.stack); send({ type: 'fatal', dest: 'main' }); }))
    process.addListener('message', message => {
      moduleListener(message)
      commonListener(message)
    })
  } else {
    // main process
    apiModule = processApiModule
  }
}

function fork(name, path, { args = [], globals = {}, numOfProcesses = 1 } = {}) {
  if (isMain()) {
    const forkedProcesses = []
    for (let idx = 0; idx < numOfProcesses; idx++) {
      const busArgs = { name, globals }
      const forkedProcess = cp.fork(path, args.concat('[PM_ARGS]' + JSON.stringify(busArgs)))
      forkedProcesses.push(forkedProcess)
      forkedProcess.addListener('message', message => {
        mainListener(message)
        commonListener(message)
      })
    }
    forkedModules.set(name, { processes: forkedProcesses, current: 0 })
  } else {
    send({ type: 'fork', dest: 'main', source: moduleName, name, path, args })
  }
}

function isMain() { return moduleName === 'main' }

function mainListener(message) {
  const { type, source, dest, fnName, fnArgs, result, error, rpcId } = message
  if (type === 'fork') return fork(message.name, message.path, message.args)
  if (type === 'rpc') {
    // console.log('MAIN CATCH rpc', source, dest, fnName)//, message)
    if (source === 'main') {
      resolved(rpcId, result, error)
    } else {
      if ('result' in message || 'error' in message) {
        send(message, message.source)
      } else {
        send(message)
      }
    }
  }
  if (type === 'fatal') { forkedModules.forEach(fork => fork.processes.forEach(pr => pr.kill())); process.exit(1) }
}

async function moduleListener(message) {
  const { type, source, dest, fnName, fnArgs, result, rpcId } = message
  if (type === 'globals') {
    Object.assign(global, message.globals)
  }
}

async function runFunction(fnName, fnArgs) {
  if (typeof apiModule.exports[fnName] === 'function') {
    try {
      const result = await apiModule.exports[fnName](...fnArgs)
      return { result }
    } catch (error) {
      utils.logv(error)
      return { error: error.toString() }
    }
  } else {
    return { error: `function ${fnName} is not exported by module ${dest}` }
  }
}

async function commonListener(message) {
  // console.log('******', moduleName, message)
  const { type, source, dest, fnName, fnArgs, result, error, rpcId } = message
  if (type === 'rpc' && source === moduleName) resolved(rpcId, result, error)
  if (type === 'rpc' && dest === moduleName) {
    const result = await runFunction(fnName, fnArgs)
    send(Object.assign(message, result))
  }
}

async function send(message, target, allModuleProcesses = false) {
  // console.log(`[${moduleName}] ${message.source}=>${message.dest}.${message.fnName} : ${'result' in message ? 'done' : 'error' in message ? 'error' : 'pending'}`)
  if (!isMain()) return process.send(message)
  target = target || message.dest
  if (target === 'main') return
  const destModule = forkedModules.get(target)
  if (!destModule) throw new Error(`rpc - target module ${message.dest} is not defined (asked by ${message.source}) ${moduleName}`, message)
  if (allModuleProcesses) {
    destModule.processes.forEach(proc => proc.send(message))
  } else {
    roundRobin(destModule)
    destModule.processes[destModule.current].send(message)
  }
}

async function rpc(target, fnName, fnArgs = []) {
  return new Promise((resolve, reject) => {
    const rpcId = Math.trunc(Math.random() * 10e10)
    // console.log({ type: 'rpc', source: moduleName, dest: target, fnName, fnArgs, rpcId })
    send({ type: 'rpc', source: moduleName, dest: target, fnName, fnArgs, rpcId })
    pending.set(rpcId, { resolve, reject, fnName })
  })
}

function resolved(rpcId, result, error) {
  const pendingResolve = pending.get(rpcId)
  if (pendingResolve) {
    !error ? pendingResolve.resolve(result) : pendingResolve.reject(error)
    pending.delete(rpcId)
  }
}

function roundRobin(mod) {
  if (mod.current < mod.processes.length - 1) {
    mod.current += 1
  } else {
    mod.current = 0
  }
}


module.exports = {
  attach,
  fork,
  rpc,
  send,
}