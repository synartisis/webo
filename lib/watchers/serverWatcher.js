const chokidar = require('chokidar')

const watcher = chokidar.watch(root)

watcher.on('change', async path => {
  console.log(path)
})