#! /usr/bin/env node

const { init } = require('./lib/state')
const { checkVersion } = require('./lib/utils')

checkVersion()

let [ , ,command, root ] = process.argv
if (!command) command = 'dev'


;(async () => {

  const started = new Date()
  console.log('==', started.toISOString().split('T')[1], '==')


  if (['dev', 'build'].includes(command)) await init(command, root)

  if (['dev', 'build', 'init'].includes(command)) {
    await require(`./lib/${command}/${command}`)()
  } else {
    console.error(`command ${command} does not exist`)
  }
    

  const ended = new Date()
  console.log('==', ended.toISOString().split('T')[1], '==')
  console.log('== Time elapsed', (ended.getTime() - started.getTime()) / 1000, 's ==')

})()