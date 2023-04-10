export async function webo(config: Webo.Config, nodeArgs: any): Promise<void>



declare global {

  namespace Webo {

    type Command = 'dev' | 'build' | 'config' | 'deploy' | 'init'
    type ProjectTypes = 'static' | 'user'
    type FileTypes = 'html' | 'css' | 'js-module' | 'js-script' | 'js-legacy' | 'vue' | 'raw' | 'dev-dep'
  
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
      deployTo: string,
      service: string,
      template: string
      verbose: boolean,
  
      projectType?: ProjectTypes,
      showConfig?: boolean,
      debug?: boolean,
    }
  
    interface CommandResult {
      exitCode: number,
      message: string,
    }

    interface File {
      type: FileTypes | null,
      content?: string,
      deps: FileDeps,
      hash?: string,
      parseCount: number,
    }

    interface FileDeps {
      [filename: string]: { type: FileTypes }
    }

  }

  function log(message?: any, ...optionalParams: any[]): void
  function logv(message?: any, ...optionalParams: any[]): void

}