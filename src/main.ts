import {
  log,
}                    from './config'

import { getWechaty } from './get-wechaty'
import { setupBot }   from './setup-bot'
import { startFinis } from './setup-finis'
import { startWeb }   from './start-web'

async function main () {
  log.verbose('main', 'main()')

  const name = process.env.WECHATY_NAME || 'Mike BO'

  const bot = getWechaty(name)

  await startFinis(bot)
  await setupBot(bot)
  await bot.start()
  await startWeb(bot)

  await bot.state.ready('off')

  return 0
}

main()
  .then(process.exit)
  .catch((e) => {
    log.error('Main', 'main() rejection: %s', e)
    process.exit(1)
  })
