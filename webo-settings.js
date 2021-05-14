exports.commandsAllowed = [ 'dev', 'build', 'config' ]

const extensionsSupported = ['html', 'css', 'js', 'mjs', 'vue']

exports.parsable = function parsable(path) {
  const filename = path.replace(/\\/g, '/').split('/').pop()
  const ext = filename.split('.').pop()
  // if (filename.includes('.min.')) return false
  // if (ext === 'html' && filename.startsWith('_')) return false
  return extensionsSupported.includes(ext)
}