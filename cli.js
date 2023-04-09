#! /usr/bin/env node

import { createConfig } from './lib/config.js'
import { webo } from './lib/webo.js'

const { config, nodeArgs } = createConfig()

const weboResult = await webo(config, nodeArgs)
if (weboResult.exitCode !== 0) log(`_RED_ERROR: ${weboResult.message}`)

process.exit(weboResult.exitCode)

// @ts-ignore
// process.on('unhandledRejection', r => { config.verbose ? logv(`\r_LIGHTRED_${r.stack ?? r}`) : log(`\r_LIGHTRED_${r}`); process.exit(1); })
