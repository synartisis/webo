const fs = require('fs')
const { promisify } = require('util')
const path = require('path')
const acorn = require('acorn')
const { createDep } = require('./dep')

const resolveJs = module.exports = async (filename, root, options) => {
  try {
    // filename = path.resolve(filename)
    let content = await promisify(fs.readFile)(filename, 'utf8')
    // if (!content && !filename.endsWith('.js')) { filename += '.js'; content = await promisify(fs.readFile)(filename, 'utf8') }
    const ast = acorn.parse(content, { sourceType: options.type, ecmaVersion: 8 })

    let deps = []

    const imports = ast.body.filter(o => o.type === 'ImportDeclaration').map(o => o.source.value)//.map(o => !o.endsWith('.js') ? o + '.js' : o)
    deps.push(...imports.map(o => createDep(filename, o, 'module', root)))

    let requires = []
    ast.body.filter(o => o.type === 'VariableDeclaration').forEach(node => {
      node.declarations.filter(o => o.type === 'VariableDeclarator' && o.init && o.init.callee && o.init.callee.name === 'require').forEach(decl => {
        if (decl.init.arguments && decl.init.arguments.length) {
          let path = decl.init.arguments[0].value
          // if (!path.endsWith('.js')) path += '.js'
          const f = requires.push(path)
        }
      })
    })
    deps.push(...requires.map(o => createDep(filename, o, 'module', root)))

    await Promise.all(deps.map(async o => {
      const childDeps = await resolveJs(o.path, root, { type: o.type })
      deps.push(... childDeps)
    }))
    
    return deps
  } catch (error) {
    console.error(`Error parsing ${filename} - ${error}`)
    return []
  }
}
