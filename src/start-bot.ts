import {
  Wechaty, Contact,
}                   from 'wechaty'

import {
  log,
}               from './config'
import { chatops } from './chatops'
import { WTmp } from './wtmp'

export async function startBot (wechaty: Wechaty): Promise<void> {
  log.verbose('startBot', 'startBot(%s)', wechaty)

  wechaty
    .on('scan',         './handlers/on-scan')
    .on('error',        './handlers/on-error')
    .on('friendship',   './handlers/on-friendship')
    .on('logout',       './handlers/on-logout')
    .on('login',        './handlers/on-login')
    .on('message',      './handlers/on-message')
    .on('room-topic',   './handlers/on-room-topic')
    .on('room-invite',  './handlers/on-room-invite')
    .on('room-join',    './handlers/on-room-join')
    .on('room-leave',   './handlers/on-room-leave')

  const heartbeat = async () => {
    await chatops(wechaty, `I'm alive!`)
  }
  const ONE_HOUR = 60 * 60 * 1000
  setInterval(heartbeat, ONE_HOUR)

  const wtmp = WTmp.instance()
  const loginWTmp = (user: Contact) => wtmp.login(user.name())
  const logoutWTmp = (user: Contact) => wtmp.logout(user.name())
  wechaty.on('login', loginWTmp)
  wechaty.on('logout', logoutWTmp)

}
