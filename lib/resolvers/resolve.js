module.exports = async entries => {
  let deps = []
  await Promise.all(
    entries.map(async entry => {
      const ext = entry.split('.').pop()
      if (['html', 'css', 'js'].includes(ext)) {
        const entryDeps = await require('./' + ext)(entry, entry, { type: 'module' })
        deps.push(... entryDeps)
      }
    })
  )
  return deps
}