import {
  log,
  Message,
  Wechaty,
}             from 'wechaty'

export default async function onMessage (
  this    : Wechaty,
  message : Message,
): Promise<void> {
  log.info('on-message', 'onMessage(%s)', message)

  await dingDong.call(this, message)
}

async function dingDong (
  this: Wechaty,
  message: Message,
) {
  log.info('on-message', 'dingDong()')

  const text = message.text()
  const type = message.type()
  const room = message.room()
  // const from = message.from()
  // const mentionLisrt = await message.mention()

  if (room) {
    return
  }

  if (type === Message.Type.Text) {
    if (text.toLowerCase() === 'ding') {
      await message.say('dong')
    } else if (text.match(/^findRoom /i)) {
      const topic = text.replace(/^findRoom /i, '')
      const room = await this.Room.find({ topic })
      if (room) {
        await message.say(`room id: ${room.id}`)
      } else {
        await message.say(`room not found for ${topic}`)
      }
    }
  }

}
