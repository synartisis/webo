import { parseCliArgs } from './parse-cli-args.js'
import { weboFlags } from './webo-flags.js'
import { commandsAllowed } from '../../lib/utils/utils.js'
import { createConfig } from './create-config.js'
import { version } from '../commands/config.js'

export function cliParser() {

  const { command, userEntry, weboArgs, nodeArgs } = parseCliArgs()

  if (weboArgs.v || weboArgs.version) return { exitCode: 0, message: 'v' + version }

  const validationError = validateArgs(command, userEntry, weboArgs)
  if (validationError) return { exitCode: 1, message: validationError }

  // @ts-ignore
  const config = createConfig({ command, userEntry, weboArgs })
  return { config, nodeArgs }

}


/** @type { (command: string, userEntry: string, weboArgs: any) => string | undefined } */
function validateArgs(command, userEntry, weboArgs) {
  const weboFlagsAllowed = Object.keys(weboFlags())
  if (!command) return `Usage: webo command [entry] [flags]\n  Commands: ${commandsAllowed.join(', ')}\n  Flags   : ${weboFlagsAllowed.join(', ')}`
  if (!commandsAllowed.includes(command)) return `Unknown command '${command}'\nCommands allowed : ${commandsAllowed.join(', ')}`
  if (command === 'dev' && !userEntry) return `Entry is required for 'dev' command.\nwebo dev [entry]`
  /** @type string[] */
  const invalidArgs = []
  Object.keys(weboArgs).forEach(arg => { if (!(weboFlagsAllowed.includes(arg))) invalidArgs.push(arg) })
  if (invalidArgs.length) return `Unknown flag${invalidArgs.length > 1 ? 's' : ''} ${invalidArgs.join(', ')}`
}
