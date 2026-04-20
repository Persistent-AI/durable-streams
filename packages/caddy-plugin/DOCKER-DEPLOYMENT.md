# Docker Deployment Guide

Complete guide for deploying the production Durable Streams Caddy server.

## Table of Contents

- [Docker Deployment](#docker-deployment)
- [Docker Compose](#docker-compose)
- [Configuration Examples](#configuration-examples)

---

## Docker Deployment

### Build the image

From the `packages/caddy-plugin` directory:

```bash
docker build -t durable-streams-server:latest .
```

The Dockerfile creates a minimal image (~10MB) based on `scratch` with a statically compiled binary.

### Run with in-memory storage

```bash
docker run -p 4437:4437 durable-streams-server:latest
```

### Run with persistent storage

```bash
# Create a volume
docker volume create durable-streams-data

# Run with the volume mounted
docker run -p 4437:4437 \
  -v durable-streams-data:/data \
  durable-streams-server:latest
```

### Run with custom Caddyfile

```bash
docker run -p 4437:4437 \
  -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile:ro \
  -v durable-streams-data:/data \
  durable-streams-server:latest
```

### Environment variables

The server runs Caddy, so you can use Caddy's environment variable substitution in your Caddyfile:

```bash
docker run -p 8080:8080 \
  -e HTTP_PORT=8080 \
  -v durable-streams-data:/data \
  durable-streams-server:latest
```

With a Caddyfile:

```caddyfile
:{$HTTP_PORT:4437} {
  route /v1/stream/* {
    durable_streams {
      data_dir /data
    }
  }
}
```

---

## Docker Compose

### Quick start

```bash
# Start the server
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the server
docker-compose down
```

### Custom configuration

Edit `docker-compose.yml` to customize:

```yaml
services:
  durable-streams:
    build: .
    ports:
      - "4437:4437"
    volumes:
      - durable-streams-data:/data
      - ./custom-Caddyfile:/etc/caddy/Caddyfile:ro  # Custom config
    environment:
      - TZ=America/New_York  # Set timezone
    restart: unless-stopped
```

### With TLS (HTTPS)

Create a `Caddyfile` with automatic HTTPS:

```caddyfile
{
  email your-email@example.com
}

streams.example.com {
  route /v1/stream/* {
    durable_streams {
      data_dir /data
    }
  }
}
```

Update `docker-compose.yml`:

```yaml
services:
  durable-streams:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - durable-streams-data:/data
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/root/.local/share/caddy  # For TLS certificates
```

---

## Configuration Examples

### Production Caddyfile with multiple features

```caddyfile
{
  admin off
  log {
    output stdout
    format json
    level INFO
  }
}

:4437 {
  # Request logging
  log {
    output stdout
    format json
  }

  # Metrics endpoint
  route /metrics {
    metrics /metrics
  }

  # Health check endpoint
  route /health {
    respond "OK" 200
  }

  # Durable Streams endpoint
  route /v1/stream/* {
    durable_streams {
      # File-backed storage
      data_dir /data

      # Optional: Set max stream size (e.g., 100MB)
      # max_stream_size 104857600
    }
  }

  # Catch-all for other paths
  route {
    respond "Durable Streams Server" 200
  }
}
```

## Testing the deployment

### Docker

```bash
# Create a stream
curl -X PUT http://localhost:4437/v1/stream/test-stream

# Append data
curl -X POST http://localhost:4437/v1/stream/test-stream \
  -H "Content-Type: application/octet-stream" \
  -d "Hello from Docker"

# Read the stream
curl http://localhost:4437/v1/stream/test-stream
```

## Production Checklist

- [ ] Use persistent storage with regular backups
- [ ] Enable TLS/SSL for external access
- [ ] Configure resource limits and requests

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs <container-id>
```

### Permission denied errors

The container runs as root by default. If using mounted volumes with specific permissions:

```bash
# Fix permissions
chmod -R 777 /path/to/data
```

### Out of disk space

```bash
# Check disk usage
docker system df
# Clean up old data
docker volume prune
```

### Network connectivity issues

```bash
# Test from inside container
docker exec -it <container-id> /usr/local/bin/durable-streams-server version
```

---

## Further Reading

- [Caddy Documentation](https://caddyserver.com/docs/)
- [Durable Streams Protocol](../../PROTOCOL.md)
