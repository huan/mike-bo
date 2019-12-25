import {
  Room,
  Wechaty,
  Message,
}             from 'wechaty'

import {
  log,
}                   from './config'

const CHATOPS_ROOM_TOPIC  = 'ChatOps - Mike BO'
export const CHATOPS_ROOM_ID     = '5611663299@chatroom'

let room: Room

export async function chatops (
  bot: Wechaty,
  textOrMessage: string | Message,
): Promise<void> {
  log.info('chatops', 'chatops(%s)', textOrMessage)

  const online = bot.logonoff()
  if (!online) {
    log.error('chatops', 'chatops() bot offline')
    return
  }

  if (!room) {
    let tryRoom = await bot.Room.find({ topic: CHATOPS_ROOM_TOPIC })
    if (!tryRoom) {
      tryRoom = bot.Room.load(CHATOPS_ROOM_ID)
    }

    room = tryRoom
  }

  await room.say(`${textOrMessage}`)

  if (textOrMessage instanceof Message) {
    switch (textOrMessage.type()) {
      case Message.Type.Image:
        const image = await textOrMessage.toFileBox()
        await room.say(image)
        break
      case Message.Type.Url:
        const urlLink = await textOrMessage.toUrlLink()
        await room.say(urlLink)
        break
      default:
        const typeName = Message.Type[textOrMessage.type()]
        await room.say(`message type: ${typeName}`)
        break
    }
  }

}
