const baseConfig = {

  command: '',
  userEntry: '',

  serverRoots: [],
  clientRoots: [],

  watchServer: false,
  watchClient: false,

  bundle: false,
  transpile: false,
  minify: false,
  legacy: false,
  cachebust: false,

  output: '',
  verbose: false,

}


const configOverrides = {

  dev: {
    watchServer: true,
    watchClient: true,
  },

  build: {
    output: 'dist/'
  },

  config: {
  },

}


/** @type {(commant: Webo.Command) => Webo.Config} */
export function getConfig(command) {
  return { ...baseConfig, command, ...configOverrides[command] }
}