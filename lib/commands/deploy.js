import { execSync } from "node:child_process"


/** @type {(config: Webo.Config) => Promise<Webo.CommandResult>} */
export default async function deploy(config) {

  if (!config.output) return { exitCode: 1, message: 'output is not defined' }
  if (!config.deployTo) return { exitCode: 1, message: 'deploy-to is not defined' }

  const deployTo = parsePath(config.deployTo)

  const serviceCommands = config.service ? `&& systemctl restart ${config.service} && systemctl status ${config.service}` : ''
  const remoteCommands = `cd ${deployTo.dirpath} && npm i --production` + serviceCommands

  const rSync =  exec(`rsync -avzu --delete --exclude node_modules/ ${config.output} ./package*.json ${deployTo.fullpath}`)
  const execRemoteCommands = exec(remoteCommands, deployTo.origin)
  console.log(rSync.stdout)
  console.error(rSync.stderr)
  console.log(execRemoteCommands.stdout)
  console.error(execRemoteCommands.stderr)
  if (rSync.status !== 0 || execRemoteCommands.status !== 0) return { exitCode: rSync.status + execRemoteCommands.status, message: 'an error occured' }

  log(`_GREEN_deploy completed succesfully`)
  return { exitCode: 0, message: `deploy succesfull` }  
}



/** @type {(command: string, origin?: string, throwMessage?: string) => { stdout: string, stderr?: string, status: number }} */
function exec(command, origin, throwMessage) {
  const finalCommand =  origin
    ? `ssh ${origin} '${command}'`
    : `${command}`
  try {
    const stdout = execSync(finalCommand, { stdio: 'pipe' }).toString().trim()
    return { stdout, status: 0 }
  } catch (/** @type {any} */error) {
    if (throwMessage) { console.error(throwMessage); process.exit(error.status) }
    return { stdout: error.stdout.toString(), stderr: error.stderr.toString(), status: error.status}
  }
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
