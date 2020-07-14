import {
  log,
}                    from 'wechaty'

import { getWechaty } from './wechaty/mod'
import { startWeb }   from './web/mod'

import { startFinis } from './setup-finis'

async function main () {
  log.verbose('main', 'main()')

  const name = process.env.WECHATY_NAME || 'Mike BO'

  const bot = getWechaty(name)

  await startFinis(bot)
  await startWeb(bot)

  await bot.start()
  await bot.state.ready('off')

  return 0
}

main()
  .then(process.exit)
  .catch((e) => {
    log.error('Main', 'main() rejection: %s', e)
    process.exit(1)
  })
