import {
  log,
}                    from './config'

import { getWechaty } from './get-wechaty'
import { startBot }   from './start-bot'
import { startFinis } from './start-finis'
import { startWeb }   from './start-web'

async function main () {
  log.verbose('main', 'main()')

  const name = process.env.WECHATY_NAME || 'Mike BO'

  const bot = getWechaty(name)

  await Promise.all([
    bot.start(),
    startBot(bot),
    startFinis(bot),
    startWeb(bot),
  ])

  await bot.state.ready('off')

  return 0
}

main()
  .then(process.exit)
  .catch((e) => {
    log.error('Main', 'main() rejection: %s', e)
    process.exit(1)
  })
