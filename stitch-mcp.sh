#!/usr/bin/env bash

# Google Stitch MCP Server - Unix Shell Wrapper
# This script calls the Node.js MCP server

set -e

# Determine script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_PATH="${SCRIPT_DIR}/stitch-mcp.js"

# If not in same directory, try npm global path
if [ ! -f "$SCRIPT_PATH" ]; then
    NPM_PREFIX=$(npm config get prefix 2>/dev/null || echo "/usr/local")
   SCRIPT_PATH="${NPM_PREFIX}/lib/node_modules/@google/stitch-sdk/stitch-mcp.js"
fi

# Check if script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Error: Could not find stitch-mcp.js" >&2
    echo "Please ensure @google/stitch-sdk is installed globally:" >&2
    echo "  npm install -g @google/stitch-sdk" >&2
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH" >&2
    echo "Please install Node.js from https://nodejs.org" >&2
    exit 1
fi

# Execute the Node.js script with all arguments
exec node "$SCRIPT_PATH" "$@"
