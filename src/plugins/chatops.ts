import { ChatOps } from 'wechaty-plugin-contrib'

import { CHATOPS_ROOM_ID } from '../config'

export const ChatOpsPlugin = ChatOps({
  at: true,
  dm: true,
  room: CHATOPS_ROOM_ID,
})
