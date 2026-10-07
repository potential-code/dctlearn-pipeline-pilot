#!/bin/sh
set -e

# Apply pending migrations first; a failure stops the container instead of serving a broken schema.
bun dist/migrate.js

# exec: bun becomes PID 1 and receives SIGTERM directly for a graceful shutdown.
exec bun dist/index.js
