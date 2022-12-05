import { DingDongPlugin } from './ding-dong.js'
import { HeartbeatPlugin } from './heartbeat.js'
import { ChatOpsPlugin } from './chatops.js'
import { RoomInvitationAccepterPlugin } from './room-invitation-accepter.js'

const pluginList = [
  ChatOpsPlugin,
  DingDongPlugin,
  HeartbeatPlugin,
  RoomInvitationAccepterPlugin,
]

export { pluginList }
