import { EventHotHandlerPlugin } from './event-hot-handler'
import { DingDongPlugin } from './ding-dong'
import { HeartbeatPlugin } from './heartbeat'
import { ChatOpsPlugin } from './chatops'
import { RoomInvitationAccepterPlugin } from './room-invitation-accepter'

const pluginList = [
  ChatOpsPlugin,
  DingDongPlugin,
  EventHotHandlerPlugin,
  HeartbeatPlugin,
  RoomInvitationAccepterPlugin,
]

export { pluginList }
