import {
  DurableStreamTestServer,
  createRegistryHooks,
} from "./packages/server/dist/index.js"

const port = parseInt(process.env.PORT || "4437")
const host = process.env.HOST || "0.0.0.0"
const dataDir = process.env.DATA_DIR

console.log("INFO: Starting Durable Streams server...")
console.log(`INFO:   Port: ${port}`)
console.log(`INFO:   Host: ${host}`)
if (dataDir) console.log(`INFO:   Data directory: ${dataDir}`)

const serverOptions = { port, host }
if (dataDir) {
  const { FileBackedStreamStore } =
    await import("./packages/server/dist/index.js")
  serverOptions.store = new FileBackedStreamStore({ dataDir })
}

const server = new DurableStreamTestServer(serverOptions)
const url = await server.start()

// Add registry hooks for observability
const hooks = createRegistryHooks(server.store, url)
server.options.onStreamCreated = hooks.onStreamCreated
server.options.onStreamDeleted = hooks.onStreamDeleted

console.log(`INFO: Durable Streams server running at ${url}`)
console.log(`INFO: Registry stream: ${url}/v1/stream/__registry__`)

// Handle graceful shutdown
const shutdown = async () => {
  console.log("\nShutting down server...")
  await server.stop()
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
