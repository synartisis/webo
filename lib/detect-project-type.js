import path from 'node:path'
import fs from 'node:fs/promises'


export async function detectProjectType(config) {
  if (!config.userEntry) return 'user'
  const userEntryPath = path.resolve(config.userEntry)
  const isStatic = (await fs.stat(userEntryPath)).isDirectory()

  return isStatic ? 'static' : 'user'
}