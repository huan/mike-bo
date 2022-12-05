import type { Wechaty } from 'wechaty'

import onError from './on-error.js'
import onFriendship from './on-friendship.js'
import onLogin from './on-login.js'
import onLogout from './on-logout.js'
import onMessage from './on-message.js'
import onScan from './on-scan.js'
import onRoomJoin from './on-room-join.js'
import onRoomLeave from './on-room-leave.js'
import onRoomTopic from './on-room-topic.js'

export function registerHandlers (wechaty: Wechaty) {
  wechaty.on('error', onError)
  wechaty.on('friendship', onFriendship)
  wechaty.on('login', onLogin)
  wechaty.on('logout', onLogout)
  wechaty.on('message', onMessage)
  wechaty.on('scan', onScan)
  wechaty.on('room-join', onRoomJoin)
  wechaty.on('room-leave', onRoomLeave)
  wechaty.on('room-topic', onRoomTopic)
}
