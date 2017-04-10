#! /usr/bin/env node

const [ , , projectType, root ] = process.argv
const COLORS = { GREEN: '\x1b[32m', RED: '\x1b[31m', RESET: '\x1b[0m' }


const path = require('path')
const chokidar = require('chokidar')

const watcher = chokidar.watch(root)

watcher.on('change', async filepath => {
  const absPath = path.resolve(filepath)
  delete require.cache[absPath]
  expressApp.close()
  console.log(`${COLORS.GREEN}webo server side restarting${COLORS.RESET}`)
  expressApp = require(path.resolve(filepath))
})

if (!projectType || !root) { console.log(`Usage : webo express [express_server_path]`); process.exit() }
console.log(`${COLORS.GREEN}webo starting${COLORS.RESET}`)

let expressApp = require(path.resolve(root))
if (!expressApp || !expressApp._events || !expressApp._events.request) throw `${COLORS.RED}Cannot find express server. Make sure you are exporting your server.${COLORS.RESET}`


let config = {}
try {
  config = require(path.resolve('./webo.config.js'))
} catch (error) { }

require('./lib/middleware')(config, root)