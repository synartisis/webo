const extensionsSupported = ['html', 'css', 'js', 'mjs', 'vue']

/** @type {(path: string) => boolean} */
export function parsable(path) {
  if (typeof path !== 'string') return false
  const filename = path.replace(/\\/g, '/').split('/').pop() ?? ''
  const ext = filename.split('.').pop()
  return !!ext && extensionsSupported.includes(ext)
}