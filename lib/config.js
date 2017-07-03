module.exports = {

  srcRoot: '.',
  destRoot: 'dist',
  include: ['**/*.html'],
  exclude: ['node_modules/**'],
  layout: null,

  dev: {
    bundle: true,
    transpile: false,
    minify: false,
    hash: false,
    port: 3000,
  },

  build: {
    bundle: true,
    transpile: true,
    minify: true,
    hash: true,
  },

}
