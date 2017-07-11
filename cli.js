#! /usr/bin/env node

const state = require('./lib/state')
const { checkVersion } = require('./lib/utils')

checkVersion()

let [ , ,command, root, ...args ] = process.argv
if (!command) command = 'dev'

let options = {}
args = args.join(' ').split('-').filter(o => !!o).map(o => o.trim())
args.forEach(arg => {
  const [ k, v ] = arg.split(' ')
  if (k !== undefined && v !== undefined) {
    options[k] = v
  }
})

if (options.layout) options.config = { layout: options.layout } // HACK

;(async () => {

  const started = new Date()
  console.log('==', started.toISOString().split('T')[1], '==')


  if (command === 'dev' && options.express) require('./lib/dev/express')(options.express)

  if (['dev', 'build'].includes(command)) await state.init(command, root, options)

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