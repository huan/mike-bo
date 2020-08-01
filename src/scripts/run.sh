#!/usr/bin/env bash

set -x
set -eo pipefail

function update () {
  git checkout .
  git pull
  rm -f package-lock.json
  npm i
  npm run build
}

function main () {
  while true
  do
    if update; then
      node dist/src/main.js || true
    fi
    sleep 1
  done
}

main
