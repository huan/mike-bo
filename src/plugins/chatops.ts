import { ChatOps } from 'wechaty-plugin-contrib'

import { CHATOPS_ROOM_ID } from '../database.js'

export const ChatOpsPlugin = ChatOps({
  contact : true,
  mention : true,
  room    : CHATOPS_ROOM_ID,
})
