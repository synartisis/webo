import fs from 'node:fs/promises'

const __dirname = new URL('.', import.meta.url).pathname
const pkg = await fs.readFile(__dirname + '../package.json', 'utf8')
const json = JSON.parse(pkg)
export const version = json.version

export default async function config(config, nodeArgs) {
  return { version, config, nodeArgs }
}