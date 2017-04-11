#! /usr/bin/env node

const [ , , projectType, root ] = process.argv
global.COLORS = { GREEN: '\x1b[32m', RED: '\x1b[31m', YELLOW: '\x1b[33m', DIM: '\x1b[2m', RESET: '\x1b[0m' }


const path = require('path')

if (!projectType || !root) { console.log(`Usage : webo express [express_server_path]`); process.exit() }
console.log(`${COLORS.GREEN}webo starting${COLORS.RESET}`)


let config = {}
try {
  config = require(path.resolve('./webo.config.js'))
} catch (error) { }


switch (projectType) {
  case 'express':
    require('./lib/express')(config, root)
    break;
  default:
    console.log(`${COLORS.RED}Not recognized project type ${projectType} ${COLORS.RESET}`)
    process.exit()
}
