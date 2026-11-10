#!/bin/bash
cd "$(dirname "$0")/.."
bun build ./companion/index.ts --compile --outfile ./companion/knowlinux-agent
