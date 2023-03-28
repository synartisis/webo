
/** @type {(config: Webo.Config, nodeArgs: string) => Promise<Webo.CommandResult>} */
export default async function config(config, nodeArgs) {
  console.log(JSON.stringify({ config, nodeArgs }, null, 2))
  return { exitCode: 0, message: '' }
}