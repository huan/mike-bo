import {
  Wechaty,
  Contact,
  log,
}                   from 'wechaty'

import { Wtmp }     from './wtmp'

import { EventHotHandlerPlugin } from './plugins/event-hot-handler'
import { DingDongPlugin } from './plugins/ding-dong'
import { HeartbeatPlugin } from './plugins/heartbeat'
import { ChatOpsPlugin } from './plugins/chatops'
import { RoomInvitationAccepterPlugin } from './plugins/room-invitation-accepter'

export async function setupBot (wechaty: Wechaty): Promise<void> {
  log.verbose('startBot', 'startBot(%s)', wechaty)

  wechaty.use(
    DingDongPlugin,
    HeartbeatPlugin,
    ChatOpsPlugin,
    EventHotHandlerPlugin,
    RoomInvitationAccepterPlugin,
  )

  const wtmp = Wtmp.instance()
  const loginWtmp = (user: Contact) => wtmp.login(user.name())
  const logoutWtmp = (user: Contact) => wtmp.logout(user.name())
  wechaty.on('login', loginWtmp)
  wechaty.on('logout', logoutWtmp)

}
