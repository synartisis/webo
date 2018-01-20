const defaultOptions = {
  v: { default: true },
  verbose: { default: false },
  'bundle': { default: true },
  'no-bundle': { default: true },
  'transpile': { default: true },
  'no-transpile': { default: true },
  'minify': { default: true },
  'no-minify': { default: true },
  'hash': { default: true },
  'no-hash': { default: true },
  'legacy': { default: true },
  'no-legacy': { default: true },
  'port': { default: true },
  'preset-build': { default: true },
  // type: { default: 'static', available: ['static', 'express'] },
}
const defaultOptionsPlain = Object.keys(defaultOptions).reduce((flat, k) => { flat[k] = defaultOptions[k].default; return flat }, {})

const MODES = ['dev', 'build', 'init']
const USAGE = `usage: webo [mode] [entry] [options]\n\n available modes: ${MODES}\n entry: static root path or express.js entry\n available options: ${Object.keys(defaultOptionsPlain)}`

const commandLineArgs = ' ' + process.argv.splice(2).join(' ')
let [ commandLineMain, ...commandLineArgsOptions ] = commandLineArgs.split(' -')
commandLineMain = commandLineMain.trim()
commandLineArgsOptions = commandLineArgsOptions.map(o => '-' + o)
// console.log({ commandLineArgs, commandLineMain, commandLineArgsOptions })

let [ mode, entry ] = commandLineMain.split(' ')
entry = entry && entry.replace(/\\/g, '/')

const options = parseUserOptions(commandLineArgsOptions, defaultOptions)
if (!options.v && !MODES.includes(mode)) { console.log(USAGE); process.exit(1) }


module.exports = { mode, entry, options }






function parseUserOptions(commandLineOptions, defaultOptions) {
  const userOptions = commandLineOptions.reduce(({flat, lastProp}, arg) => { 
    if (arg.startsWith('-')) {
      lastProp = arg.replace(/^-/, '').replace(/^-/, '')
      flat[lastProp] = true
    } else {
      flat[lastProp] = arg
    }
    return { flat, lastProp }
  }, { flat: {}, lastProp: null }).flat
  const invalidOption = Object.keys(userOptions).find(k => !Object.keys(defaultOptions).includes(k) || (defaultOptions[k].available && !defaultOptions[k].available.includes(userOptions[k])))
  if (invalidOption) { 
    console.log(defaultOptions[invalidOption] ? `invalid option value for ${invalidOption}. Valid values : ${defaultOptions[invalidOption].available.join(', ')}` : `invalid option ${invalidOption}`)
    process.exit(1)
  }
  return userOptions
}
