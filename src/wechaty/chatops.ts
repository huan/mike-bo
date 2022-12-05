import {
  Room,
  log,
}               from 'wechaty'
import {
  types,
  talkers,
}               from 'wechaty-plugin-contrib'

import { CHATOPS_ROOM_ID } from '../database.js'

import { getWechaty } from '../wechaty/mod.js'

let room: Room

async function chatops (msg: types.SayableMessage): Promise<void> {
  log.verbose('chatops', 'chatops(%s)', msg)

  if (!room) {
    room = getWechaty().Room.load(CHATOPS_ROOM_ID)
  }

  await talkers.roomTalker(msg)(room)
}

export { chatops }
