#! /usr/bin/env node

const { cliParser } = require('./cli-parser/cli-parser.js')
const { webo } = require('./webo.js')

const { config, nodeArgs, exitCode, message } = cliParser()

if (exitCode != null) {
  exitCode === 0 ? console.log(message) : console.error(message)
  process.exit(exitCode)
}

webo(config, nodeArgs)
.then(weboResult => {
  if (weboResult) console.dir(weboResult)
})


process.on('unhandledRejection', r => { config.verbose ? logv(`\r_LIGHTRED_${r.stack ?? r}`) : log(`\r_LIGHTRED_${r}`); process.exit(1) })
process.on('SIGINT', () => { log('\r_GREEN_webo ended by user'); process.exit(1) })