import {
  log,
  RoomInvitation,
  Wechaty,
}                   from 'wechaty'

import {
  Chatops,
}                 from '../chatops'

export default async function onRoomInvite (
  this           : Wechaty,
  roomInvitation : RoomInvitation
): Promise<void> {
  log.info('on-room-invite', 'onRoomInvite(%s)', roomInvitation)

  const topic = await roomInvitation.topic()
  const inviter = await roomInvitation.inviter()

  await Chatops.instance().say(`recreived room invitation from ${inviter} to ${topic}`)
  await roomInvitation.accept()
  await Chatops.instance().say('accepted.')
}
