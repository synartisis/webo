const isDev = process.env.NODE_ENV !== 'production'

if (isDev) {
  module.exports = require('./lib/server/middleware')
} else {
  module.exports = config => (req, res, next) => next() // nullify webo on production
}
