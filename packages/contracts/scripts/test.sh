#!/bin/bash

# Run all contract tests
# Usage: ./scripts/test.sh [--nocapture]

set -e

echo "🧪 Running Nuna Curate Smart Contract Tests..."
echo ""

# Run tests with or without output capture
if [ "$1" = "--nocapture" ]; then
    cargo test --all -- --nocapture
else
    cargo test --all
fi

echo ""
echo "✓ All tests passed!"
