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
  this:     Wechaty,
  message:  Message,
) {
  log.info('on-message', 'dingDong()')

  let text = message.text()
  const type = message.type()
  const room = message.room()
  // const from = message.from()
  const mentionSelf = await message.mentionSelf()

  if (room && !mentionSelf) {
    return
  } else {
    log.info('on-message', 'dingDong() message in room and mentioned self')
    text = await message.mentionText()
  }

  if (type === Message.Type.Text) {
    if (text.toLowerCase() === '/#ding') {
      await message.say('dong')
    } else if (text.match(/^#findRoom /i)) {
      const topic = text.replace(/^#findRoom /i, '')
      log.info('on-message', 'dingDong() findRoom(%s)', topic)

      const room = await this.Room.find({ topic })
      if (room) {
        await message.say(`room id: "${room.id}"`)
      } else {
        await message.say(`room not found for "${topic}"`)
      }
    } else if (text.match(/^#card /i)) {
      const url = text.replace(/^#card /i, '')
      log.info('on-message', 'dingDong() card(%s)', url)

      const urlLink = await this.UrlLink.create(url)
      await message.say(urlLink)
    }
  }

}
