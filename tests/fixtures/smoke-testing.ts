#!/usr/bin/env ts-node

import { getWechaty } from '../../src/get-wechaty.js'
import { startWeb } from '../../src/start-web.js'

async function main () {
  await startWeb(
    await getWechaty('smoke-testing'),
  )
  return 0
}

main()
  .then(process.exit)
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
