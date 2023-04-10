import esma from 'esma'

const server = esma.createServer()
const port = process.env.NODE_PORT || 3000
const __dirname = new URL('.', import.meta.url).pathname

server.use(esma.static(__dirname + '../client', { extensions: ['html'] }))


server.listen(port, () => console.log('listening', port))