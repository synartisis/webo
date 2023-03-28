export async function webo(config: Webo.Config, nodeArgs: any): Promise<void>



declare global {

  namespace Webo {

    type Command = 'dev' | 'build' | 'config'
    type ProjectTypes = 'static' | 'user'
  
    interface Config {
      version: string
      command: Command,
      userEntry: string,
      serverRoots: string[],
      clientRoots: string[],
      watchServer: boolean,
      watchClient: boolean,
      bundle: boolean,
      transpile: boolean,
      minify: boolean,
      legacy: boolean,
      cachebust: boolean,
      output: string,
      verbose: boolean,
  
      projectType?: ProjectTypes,
      showConfig?: boolean,
      debug?: boolean,
    }
  
    interface CommandResult {
      exitCode: number,
      message: string,
    }

  }

  function log(message?: any, ...optionalParams: any[]): void
  function logv(message?: any, ...optionalParams: any[]): void

}