const path = require('path')
const { lstatAsync } = require('../utils/utils.js')

module.exports = async function detectProjectType(entry) {
  if (!entry) notDetected()
  if (entry.endsWith('.js') && await hasExpressInstalled()) return 'express'
  if (await isDirectory(entry)) return 'static'
  notDetected()
}


async function hasExpressInstalled() {
  try {
    const tryExpressModule = await lstatAsync(path.resolve('node_modules/express'))
  } catch (error) { notDetected() }
  return true
}

async function isDirectory(filename) {
  try {
    const stat = await lstatAsync(filename)
    return stat.isDirectory()    
  } catch (error) {
    return notDetected()
  }
}

function notDetected() {
  console.log(`Unable to detect project type. Your entry must be either a directory or an express.js entry.`)
  process.exit(1)
}