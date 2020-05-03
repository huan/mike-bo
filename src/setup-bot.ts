import {
  Wechaty,
  Contact,
}                   from 'wechaty'

import {
  DingDong,
  Heartbeat,
}                   from 'wechaty-plugin-contrib'

import {
  log,
}                  from './config'
import { Wtmp }     from './wtmp'

export async function setupBot (wechaty: Wechaty): Promise<void> {
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

  wechaty.use(
    DingDong({
      at   : true,
      room : false,
    }),
    Heartbeat({
      emoji: {
        heartbeat : '[爱心]',
        login     : '[太阳]',
        logout    : '[月亮]',
        ready     : '[拳头]',
      },
      intervalSeconds: 60 * 60,       // 1 hour
      room: '17376996519@chatroom',   // 'ChatOps - Heartbeat'
    }),
  )

  const wtmp = Wtmp.instance()
  const loginWtmp = (user: Contact) => wtmp.login(user.name())
  const logoutWtmp = (user: Contact) => wtmp.logout(user.name())
  wechaty.on('login', loginWtmp)
  wechaty.on('logout', logoutWtmp)

}
