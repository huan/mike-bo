import {
  Room,
  log,
}               from 'wechaty'
import { types } from 'wechaty-plugin-contrib'

import { CHATOPS_ROOM_ID } from '../database'

import { getWechaty } from '../wechaty/mod'

let room: Room

async function chatops (msg: types.SayableMessage): Promise<void> {
  log.verbose('chatops', 'chatops(%s)', msg)

  if (!room) {
    room = getWechaty().Room.load(CHATOPS_ROOM_ID)
  }

  await room.say(msg)
}

export { chatops }
