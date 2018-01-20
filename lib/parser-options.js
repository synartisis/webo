const defaultParserOptions = {

  dev: {
    bundle: true,
    transpile: false,
    minify: false,
    hash: false,
    legacy: false,
  },

  build: {
    bundle: true,
    transpile: true,
    minify: true,
    hash: true,
    legacy: true,
  }

}


module.exports = (mode, userOptions) => {
  let parserOptions = Object.assign({}, defaultParserOptions[mode])
  if (userOptions['preset-build']) Object.assign(parserOptions, defaultParserOptions.build, { hash: false })
  if (userOptions['no-bundle']) parserOptions.bundle = false
  if (userOptions['bundle']) parserOptions.bundle = true
  if (userOptions['no-transpile']) parserOptions.transpile = false
  if (userOptions['transpile']) parserOptions.transpile = true
  if (userOptions['no-minify']) parserOptions.minify = false
  if (userOptions['minify']) parserOptions.minify = true
  if (userOptions['no-hash']) parserOptions.hash = false
  if (userOptions['hash']) parserOptions.hash = true
  if (userOptions['no-legacy']) parserOptions.legacy = false
  if (userOptions['legacy']) parserOptions.legacy = true
  return parserOptions
}