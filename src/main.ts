import './config.ts' // load .env

import {
  log,
}                    from 'wechaty'

import { getWechaty } from './wechaty/mod.js'
import { startWeb }   from './web/mod.js'

import { startFinis } from './setup-finis.js'

async function main () {
  log.verbose('main', 'main()')

  const name = process.env['WECHATY_NAME'] || 'Mike BO'

  const bot = getWechaty(name)

  await startFinis(bot)
  await startWeb(bot)

  await bot.start()
  await bot.state.stable('inactive')
  console.info('Bot State is set to "inactive"')
  return 0
}

main()
  .then(process.exit)
  .catch((e) => {
    log.error('Main', 'main() rejection: %s', e)
    process.exit(1)
  })
