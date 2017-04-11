#! /usr/bin/env node

const [ , , projectType, root ] = process.argv

const { log } = require('./lib/utils')

if (!projectType || !root) { console.log(`Usage : webo express [express_server_path]`); process.exit() }

require('./lib/config')
log('GREEN', 'webo starting')

switch (projectType) {
  case 'express':
    require('./lib/express')(root)
    break;
  default:
    log('RED', `Not recognized project type ${projectType}`)
    process.exit()
}
