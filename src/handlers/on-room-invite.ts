import {
  log,
  RoomInvitation,
  Wechaty,
}                   from 'wechaty'

import {
  chatops,
}                 from '../chatops'

export default async function onRoomInvite (
  this           : Wechaty,
  roomInvitation : RoomInvitation
): Promise<void> {
  log.info('on-room-invite', 'onRoomInvite(%s)', roomInvitation)

  const topic = await roomInvitation.topic()
  const inviter = await roomInvitation.inviter()

  await chatops(this, `recreived room invitation from ${inviter} to ${topic}`)
  await roomInvitation.accept()
  await chatops(this, 'accepted.')
}
