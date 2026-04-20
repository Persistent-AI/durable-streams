# Multi-stage build for Durable Streams Caddy Server
# Builds a static binary with CGO disabled for minimal runtime image

# Build stage
FROM golang:1.25-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build static binary (CGO disabled for portability)
RUN CGO_ENABLED=0 GOOS=linux go build \
	-ldflags="-s -w" \
	-o durable-streams-server \
	./cmd/caddy

# Runtime stage - minimal scratch image
FROM scratch

# Copy CA certificates for HTTPS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy the binary
COPY --from=builder /build/durable-streams-server /usr/local/bin/durable-streams-server

# Copy default Caddyfile
COPY --from=builder /build/Caddyfile /etc/caddy/Caddyfile

# Create data directory
WORKDIR /data

# Expose the default port
EXPOSE 4437

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD ["/usr/local/bin/durable-streams-server", "version"] || exit 1

# Run the server with the default Caddyfile
# Users can mount their own Caddyfile at /etc/caddy/Caddyfile
ENTRYPOINT ["/usr/local/bin/durable-streams-server"]
CMD ["run", "--config", "/etc/caddy/Caddyfile"]
