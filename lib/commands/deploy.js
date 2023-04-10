import { spawn } from "node:child_process"


/** @type {(config: Webo.Config) => Promise<Webo.CommandResult>} */
export default async function deploy(config) {

  if (!config.output) return { exitCode: 1, message: 'output is not defined' }
  if (!config.deployTo) return { exitCode: 1, message: 'deploy-to is not defined' }

  const deployTo = parsePath(config.deployTo)

  const serviceCommands = config.service ? `&& systemctl restart ${config.service} && systemctl status ${config.service}` : ''
  const remoteCommands = `cd ${deployTo.dirpath} && npm i --omit=dev` + serviceCommands

  try {
    const spawnRSync = await spawnAsync(`rsync -avzu --delete --exclude node_modules/ ${config.output} ./package.json ./package-lock.json ${deployTo.fullpath}`)
  } catch (/** @type {any} */error) {
    return error
  }

  try {
    const spawnRemoteCommands = await spawnAsync(remoteCommands, deployTo.origin)
    if (spawnRemoteCommands.exitCode != 0) return spawnRemoteCommands
  } catch (/** @type {any} */error) {
    return error
  }

  log(`_GREEN_deploy completed successfully`)
  return { exitCode: 0, message: `deploy successfully` }  
}


/** @type {(fullpath: string) => { origin: string | undefined, dirpath: string, fullpath: string }} */
function parsePath(fullpath) {
  const [p1, p2] = fullpath?.split(':')
  let origin
  let dirpath
  if (!p2) {
    dirpath = p1
  } else {
    origin = p1
    dirpath = p2
  }
  return { origin, dirpath, fullpath }
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
