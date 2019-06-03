module.exports = async function config(config, nodeArgs) {
  return { version: require('../package.json').version, config, nodeArgs }
}