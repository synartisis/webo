import path from 'node:path'

export function weboFlags (config) {
  return {

    set 'server-root'(val) { config.serverRoots.push(...Array.isArray(val) ? val.map(o => path.resolve(o)) : [ path.resolve(val) ]) },
    set 's'(val) { this['server-root'] = val },

    set 'client-root'(val) { config.clientRoots.push(...Array.isArray(val) ? val.map(o => path.resolve(o)) : [ path.resolve(val) ]) },
    set 'c'(val) { this['client-root'] = val },

    set 'watch-server'(val) { config.watchServer = val },
    set 'watch-client'(val) { config.watchClient = val },
    set 'watch'(val) { config.watchServer = config.watchClient = val },

    set 'bundle'(val) { config.bundle = val },
    set 'transpile'(val) { config.transpile = val },
    set 'minify'(val) { config.minify = val },
    set 'cachebust'(val) { config.cachebust = val },
    set 'legacy'(val) { config.legacy = val },

    set 'output'(val) { config.output = val },

    set 'verbose'(val) { config.verbose = val },
    set 'debug'(val) { config.debug = val },
    set 'show-config'(val) { config.showConfig = val },

    set 'preset-dev'(val) { if (val) config.bundle = config.transpile = config.minify = config.cachebust = config.legacy = false },
    set 'preset-build'(val) { if (val) config.bundle = config.transpile = config.minify = config.cachebust = config.legacy = true },

  }
}
