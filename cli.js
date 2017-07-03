#! /usr/bin/env node

const state = require('./lib/state')

let [ , ,command, root ] = process.argv
if (!command) command = 'dev'
if (!root) root = '.'

;(async () => {

  const started = new Date()
  console.log('==', started.toISOString().split('T')[1], '==')

  state.config.srcRoot = root
  // try {
  //   if (root !== '.') process.chdir(root)
  // } catch (error) {
  //   console.error(error.code === 'ENOENT' ? `Directory ${root} not found` : error)
  //   process.exit(1)
  // }

  switch (command) {
    case 'dev':
      await state.init('dev')
      await require('./lib/dev/dev')()
      break;

    case 'build':
      await state.init('build')
      await require('./lib/build/build')()
      break;

    case 'init':
      await require('./lib/init/init')()
      break;

    default:
      console.log(`command ${command} does not exist`)
      break;
  }

  const ended = new Date()
  console.log('==', ended.toISOString().split('T')[1], '==')
  console.log('== Time elapsed', (ended.getTime() - started.getTime()) / 1000, 's ==')

})()