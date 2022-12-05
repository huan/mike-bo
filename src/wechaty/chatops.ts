import {
  Room,
  log,
  Sayable,
}               from 'wechaty'
import {
  talkers,
}               from 'wechaty-plugin-contrib'

import { CHATOPS_ROOM_ID } from '../database.js'

import { getWechaty } from '../wechaty/mod.js'

let room: undefined | Room

async function chatops (msg: Sayable): Promise<void> {
  log.verbose('chatops', 'chatops(%s)', msg)

  if (!room) {
    room = (getWechaty().Room as any).load(CHATOPS_ROOM_ID) as Room
  }

  await talkers.roomTalker(msg)(room)
}

export { chatops }
