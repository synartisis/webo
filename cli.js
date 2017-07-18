#! /usr/bin/env node

const { lstatAsync } = require('./lib/utils')

const { state, init } = require('./lib/state')
const { checkVersion } = require('./lib/utils')

checkVersion()

const cliParts = process.argv.join('__').split('-')

let [ , ,command, root ] = cliParts[0].split('__').filter(o => !!o)
let args = cliParts.length > 1 ? cliParts[1].split('__').filter(o => !!o) : []
if (!command) command = 'dev'
if (!root) root = '.'


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
  

  if (options.v) { console.log('version ' + require('./package.json').version); process.exit() }

  const started = new Date()
  console.log('==', started.toISOString().split('T')[1], '==')

  state.clientRoot = root

  if (['dev', 'build'].includes(command) && entryType === 'express') {
    let expressRoot = await require('./lib/dev/express')(root, command)
    state.serverRoot = root
    root = calcCommonRoot(root, expressRoot)
    state.clientRoot = expressRoot
  }
  
  if (['dev', 'build'].includes(command)) await init(command, root, options)
  

  if (['dev', 'build', 'init'].includes(command)) {
    await require(`./lib/${command}/${command}`)()
  } else {
    console.error(`command ${command} does not exist`)
  }
    

  const ended = new Date()
  console.log('==', ended.toISOString().split('T')[1], '==')
  console.log('== Time elapsed', (ended.getTime() - started.getTime()) / 1000, 's ==')

})()


process.on('unhandledRejection', r => console.log('[WEBO]', r))




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