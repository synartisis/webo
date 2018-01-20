#! /usr/bin/env node

const main = require('./main.js')
const { mode, entry, options } = require('./cli-args.js')

main(mode, entry, options) 
