const path = require('path')
const { stat } = require('fs').promises


exports.detectProjectType = async function detectProjectType(config) {
  if (!config.userEntry) return 'user'
  const userEntryPath = path.resolve(config.userEntry)
  const isStatic = (await stat(userEntryPath)).isDirectory()

  return isStatic ? 'static' : 'user'
}