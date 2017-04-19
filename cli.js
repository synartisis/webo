#! /usr/bin/env node

const [ , , projectType, root ] = process.argv
const cliFlags = process.argv.filter(o => o.startsWith('-')).map(o => o.replace(/^-+/g, ''))

const { log } = require('./lib/utils')

if (!projectType || !root) { log(`Usage : webo express [express_server_path]`); process.exit() }

const config = require('./lib/config')
config.cliFlags = cliFlags
log('GREEN', 'webo starting')
log('TIMESTAMP')

switch (projectType) {
  case 'express':
    require('./lib/express')(root)
    break;
  default:
    log('RED', `Not recognized project type ${projectType}`)
    process.exit()
}
