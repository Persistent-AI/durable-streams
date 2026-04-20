# Docker deployment for Durable Streams server

This guide explains how to build and run the Durable Streams server in a Docker container.

## Building the image

The Dockerfile must be run from the **monorepo root** (not from `packages/server`), as it needs
access to workspace dependencies:

```bash
# From the repository root
docker build -f packages/server/Dockerfile -t durable-streams-server .
```

## Running the container

### In-memory storage (default)

```bash
docker run -p 4437:4437 durable-streams-server
```

The server will be available at `http://localhost:4437`.

### Persistent storage with a volume

```bash
# Create a volume for persistent data
docker volume create durable-streams-data

# Run with persistent storage
docker run -p 4437:4437 \
  -e DATA_DIR=/data \
  -v durable-streams-data:/data \
  durable-streams-server
```

### Custom configuration

You can customize the server using environment variables:

```bash
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e HOST=0.0.0.0 \
  -e DATA_DIR=/data \
  -v ./my-data:/data \
  durable-streams-server
```

## Environment variables

- `PORT` - Server port (default: `4437`)
- `HOST` - Bind address (default: `0.0.0.0`)
- `DATA_DIR` - If set, enables file-backed storage at this path (default: in-memory)
- `NODE_ENV` - Node environment (default: `production`)

## Docker Compose example

Create a `docker-compose.yml`:

```yaml
services:
  durable-streams:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
    ports:
      - "4437:4437"
    environment:
      - DATA_DIR=/data
    volumes:
      - durable-streams-data:/data
    restart: unless-stopped

volumes:
  durable-streams-data:
```

Run with:

```bash
docker-compose up -d
```

## Testing the server

Once running, test it with curl:

```bash
# Create a stream (use PUT)
curl -X PUT http://localhost:4437/my-stream

# Append data to the stream (use POST)
curl -X POST http://localhost:4437/my-stream -H "Content-Type: application/octet-stream" -d "Hello, world\!"

# Read the stream
curl http://localhost:4437/my-stream

# Check the registry (list all streams)
curl http://localhost:4437/v1/stream/__registry__
```

## Multi-architecture builds

To build for multiple architectures (e.g., ARM64 for Apple Silicon and AMD64 for x86):

```bash
# Create a new builder
docker buildx create --name multiarch --use

# Build and push to registry
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f packages/server/Dockerfile \
  -t your-registry/durable-streams-server:latest \
  --push \
  .
```

## Troubleshooting

### Permission issues with volumes

If you get permission errors with mounted volumes:

```bash
# Create directory with correct permissions
mkdir -p ./my-data
chmod 777 ./my-data

docker run -p 4437:4437 \
  -e DATA_DIR=/data \
  -v ./my-data:/data \
  durable-streams-server
```

## Production considerations

- Use a reverse proxy (nginx, Caddy) for TLS/SSL termination
- Set up monitoring and health checks
- Use persistent storage for production workloads
- Consider using the Caddy plugin (`packages/caddy-plugin`) for production deployments
- Implement backup strategy for the data directory
