#!/usr/bin/env bash
# This script redirects 'bun test' to use vitest instead of Bun's built-in test runner
#
# WHY: Our test files use vitest's vi.mock(), vi.fn(), vi.spyOn() which are not compatible
# with Bun's built-in test runner (which uses mock.module(), mock(), spyOn()).
#
# USAGE: Instead of 'bun test', use 'bun run test' or './scripts/test.sh'

set -e

cd "$(dirname "$0")/.."

echo "🧪 Running tests with vitest (via turbo)..."
echo ""

bun run test "$@"
