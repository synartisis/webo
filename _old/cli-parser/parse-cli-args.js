export function parseCliArgs() {

  const [ weboArgsString, nodeArgs ] = process.argv.splice(2).join(' ').split(' -- ')
  const userCommandAndEntry = weboArgsString.split('-')[0]
  const [ command, userEntry ] = userCommandAndEntry.split(' ')
  /** @type {any} */
  const options = {}
  if (weboArgsString.includes(userCommandAndEntry + '-')) {
    weboArgsString.replace(userCommandAndEntry + '-', '-').split(' -').filter(Boolean).forEach(arg => {
      const [ k, v ] = arg.replace('=', ' ').split(' ')
      const key = k.replace(/^--?/, '')
      if (!key) return
      const value = v === undefined ? true : v
      if (key.startsWith('no-')) return options[key.replace(/^no-/, '')] = false
      if (!(key in options)) {
        options[key] = value
      } else {
        if (Array.isArray(options[key])) {
          options[key] = [ ...options[key] , value ]
        } else {
          options[key] = [ options[key] , value ]
        }
      }
    })
  }
  // console.log({options,weboArgsString,userCommandAndEntry,command, userEntry})

  return {
    command,
    userEntry,
    weboArgs: options,
    nodeArgs,
  }

}