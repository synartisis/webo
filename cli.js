#! /usr/bin/env node

const { lstatAsync } = require('./lib/utils')

const { state, init } = require('./lib/state')
const { checkVersion, log } = require('./lib/utils')

const AVAILIABLE_COMMANDS = ['dev', 'build', 'init']

checkVersion()

const cliParts = process.argv.join('__').split('__-')

let [ , ,command, root ] = cliParts[0].split('__').filter(o => !!o)
let args = cliParts.length > 1 ? cliParts[1].split('__').filter(o => !!o) : []
if (!command) command = 'dev'
if (!root) root = '.'

if (!AVAILIABLE_COMMANDS.includes(command)) { console.error(`command ${command} does not exist`); process.exit(1) }
  
let options = {}
args = args.join(' ').split('-').filter(o => !!o).map(o => o.trim())
args.forEach(arg => {
  const [ k, v ] = arg.split(' ')
  if (k !== undefined) {
    options[k] = v || true
  }
})


if (options.layout) options.config = { layout: options.layout } // HACK

;(async () => {
  const entryType = await resolveEntry(root)
  if (!entryType) { console.error(`Entry '${root}' is not valid`); process.exit() }
  state.entryType = entryType
  
  const version = require('./package.json').version
  if (options.v) { console.log('version ' + version); process.exit() }

  const started = new Date()
  log(`_GREEN_WEBO ${version} started`)

  state.clientRoot = root
  
  if (['dev', 'build'].includes(command) && entryType === 'express') {
    let expressRoot = await require('./lib/dev/express')(root, command)
    state.serverRoot = root
    root = calcCommonRoot(root, expressRoot)
    state.clientRoot = expressRoot
  }

  if (['dev', 'build'].includes(command)) await init(command, root, options)
  

  await require(`./lib/${command}/${command}`)()

  if (command === 'dev' && entryType === 'express') require('./lib/dev/express').listen()
    

  const ended = new Date()
  log('_GREEN_WEBO loaded at', (ended.getTime() - started.getTime()) / 1000 + 's')

})()


process.on('unhandledRejection', (r, p) => p.catch(o => log('_RED_[WEBO ERROR]', o.stack)))




async function resolveEntry(entry) {
  let result
  let entryType
  try {
    result = await lstatAsync(entry)
    if (result.isDirectory()) entryType = 'static'
    if (entry.endsWith('.html')) entryType = 'static'
    if (entry.endsWith('.js')) entryType = 'express'
  } catch (error) { 
    try {
      result = await lstatAsync(entry + '.js')
      entryType = 'express'
    } catch (error) { }
  }
  return entryType
}

function calcCommonRoot(static, express) {
  const staticParts = static.split('/')
  const expressParts = express.split('/')
  let i = 0
  while (staticParts[i] === expressParts[i]) i++
  return staticParts.slice(0, i).join('/')
}