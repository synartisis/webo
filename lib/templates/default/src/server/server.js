require('express-async-errors')
const express = require('express')
const server = express()
const port = process.env.NODE_PORT || 3000

server.use(express.json())
server.use(express.static(__dirname + '/../client'))



server.listen(port, () => console.log('listening ' + port))


server.use((err, req, res, next) => {
  console.error(err)
  res.status(500).send()
})
