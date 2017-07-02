let defaultConfig = {

  srcRoot: '.',
  destRoot: 'dist',
  include: ['**/*.html'],
  exclude: ['node_modules/**'],

  dev: {
    bundle: true,
    transpile: false,
    minify: false,
    port: 3000,
  },

  prod: {
    bundle: true,
    transpile: true,
    minify: true,
  },

}

module.exports = defaultConfig