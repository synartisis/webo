import { spawn } from "node:child_process"
import * as fs from 'node:fs/promises'

const __dirname = new URL('.', import.meta.url).pathname

/** @type {(config: Webo.Config) => Promise<Webo.CommandResult>} */
export default async function init(config) {
  const dirContent = await fs.readdir('.')
  if (dirContent.filter(o => o !== '.git').length > 0) return { exitCode: 1, message: `cannot initialized: current directory is not empty` }
  if (!config.template) return { exitCode: 1, message: 'template is not defined' }
  const templates = await fs.readdir(__dirname + 'templates/')
  if (!templates.includes(config.template)) return { exitCode: 1, message: `unknown template "${config.template}". Available templates: ${templates.join(', ')}` }

  log(`initializing template "${config.template}"`)
  try {
    await spawnAsync(`rsync -a ${__dirname}templates/${config.template}/ .`)
  } catch (/** @type {any} */error) {
    return error
  }

  log(`_GREEN_init completed successfully`)
  return { exitCode: 0, message: `init completed successfully` }  
}


/** @type {(command: string, origin?: string) => Promise<{ exitCode: number, message: string }>} */
async function spawnAsync(command, origin) {
  const finalCommand =  origin
    ? `ssh ${origin} ${command}`
    : `${command}`
  const [ cmd, ...rest ] = finalCommand.split(' ')
  const sp = spawn(cmd, rest)
  return new Promise((resolve, reject) => {
    sp.stdout.on('data', (/** @type {Buffer} */data) => data.toString().split('\n').forEach(line => line ? log(`_GRAY_${line}`) : ''))
    sp.stderr.on('data', (/** @type {Buffer} */data) => data.toString().split('\n').forEach(line => line ? log(`_RED_${line}`) : ''))
    sp.on('close', code => { code === 0 ? resolve({ exitCode: 0, message: 'done' }) : reject({ exitCode: code, message: 'deploy failed' }) })
  })
}
