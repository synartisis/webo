const fs = require('fs')
const { promisify } = require('util')
const path = require('path')
const acorn = require('acorn')
const rollup = require('rollup')
const babel = require('babel-core')



module.exports = async function(content, options) {
  const { filename, type, mode, bundle, transpile, minify } = options

  const ast = acorn.parse(content, { sourceType: type, ecmaVersion: 8 })
  
  let assets = []
  
  const imports = ast.body.filter(o => o.type === 'ImportDeclaration').map(o => o.source.value)//.map(o => !o.endsWith('.js') ? o + '.js' : o)
  assets.push(...await Promise.all(imports.map(o => { return { rel: o, type: 'module' } })))

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
  assets.push(...await Promise.all(requires.map(o => { return { rel: o, type: 'module' } })))

  // await Promise.all(deps.map(async o => {
  //   const childDeps = await resolveDeps(o.path, { root, type: o.type })
  //   deps.push(... childDeps)
  // }))
  
  if (bundle && type === 'module') {
    let rollupBundle = await rollup.rollup({ 
      entry: filename, 
    })
    let { code } = rollupBundle.generate({ format: 'iife', moduleName: filename.split('/').pop().split('.')[0] + 'Bundle' })
    content = `var process = { env: { NODE_ENV: "${ mode === 'dev' ? 'development' : 'production' }" } };\n${code}`
  }

  if (transpile) {
    let presets = [[ 'babel-preset-env', { modules: false }]]
    if (minify) presets.push([ 'babel-preset-babili' ])
    const { code, map } = babel.transform(content, { presets })
    content = code
  }

  return { content, assets }
}
