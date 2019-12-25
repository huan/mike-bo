import moment from 'moment'

import {
  log,
  Message,
  Wechaty,
}             from 'wechaty'

import {
  chatops,
  CHATOPS_ROOM_ID,
} from '../chatops'

const BORN_TIME = Date.now()

export default async function onMessage (
  this    : Wechaty,
  message : Message,
): Promise<void> {
  log.info('on-message', 'onMessage(%s)', message)

  await dingDong(this, message)

  await chatopsDirectMessage(this, message)
  await chatopsRoomMentionMessage(this, message)
  await ctpStatus(this, message)
}

async function ctpStatus (
  wechaty: Wechaty,
  message: Message,
): Promise<void> {
  if (message.self()) {
    return
  }

  const room = message.room()
  if (!room) {
    return
  }

  // ChatOps - CTP Status
  const CTP_STATUS_ROOM_ID = '17962906510@chatroom'
  if (room.id !== CTP_STATUS_ROOM_ID) {
    return
  }

  let text = await message.mentionText()
  let reply
  if (text.match(/^#ding$/i)) {
    reply = 'dong'
  } else if (text.match(/^#uptime$/i)) {
    const time = moment(BORN_TIME).fromNow()
    reply = `I'm online ${time}`
  } else {
    reply = 'unknown CTP command'
  }

  await message.say(reply)
  await wechaty.sleep(1)
}

async function chatopsDirectMessage (
  wechaty: Wechaty,
  message: Message,
): Promise<void> {
  const room = message.room()
  if (room) {
    return
  }

  // direct message
  await chatops(wechaty, `${message}`)
}

async function chatopsRoomMentionMessage (
  wechaty: Wechaty,
  message: Message,
): Promise<void> {
  const room = message.room()
  if (!room) {
    return
  }

  const mentionSelf = await message.mentionSelf()
  if (!mentionSelf) {
    return
  }

  await chatops(wechaty, `${message}`)
}

async function dingDong (
  wechaty: Wechaty,
  message: Message,
) {
  log.info('on-message', 'dingDong()')

  let text = message.text()
  const type = message.type()
  const room = message.room()
  // const from = message.from()
  const mentionSelf = await message.mentionSelf()

  if (room) {
    if (!mentionSelf) {
      return
    }

    log.info('on-message', 'dingDong() message in room and mentioned self')
    text = await message.mentionText()
    console.info('mentionText', text)
  }

  if (type === Message.Type.Text) {
    if (text.match(/^#ding$/i)) {
      await message.say('dong')
    } else if (text.match(/^#findRoom /i)) {
      const topic = text.replace(/^#findRoom /i, '')
      log.info('on-message', 'dingDong() findRoom(%s)', topic)

      const room = await wechaty.Room.find({ topic })
      if (room) {
        await message.say(`room id: "${room.id}"`)
      } else {
        await message.say(`room not found for "${topic}"`)
      }
    } else if (text.match(/^#card /i)) {
      const url = text.replace(/^#card /i, '')
      log.info('on-message', 'dingDong() card(%s)', url)

      const urlLink = await wechaty.UrlLink.create(url)
      await message.say(urlLink)
    } else if (text.match(/^#roomQrcode /i)) {
      const topic = text.replace(/^#roomQrcode /i, '')
      log.info('on-message', 'dingDong() roomQrcode(%s)', topic)

      const room = await wechaty.Room.find({ topic })
      if (room) {
        const value = 'test' // await room.qrcode()
        const qrcodePng = await wechaty.qrcodePng(value)
        await message.say(qrcodePng)
      } else {
        await message.say(`room not found for "${topic}"`)
      }
    } else if (text.match(/^#announce /i)) {
      const announcement = text.replace(/^#announce /i, '')
      log.info('on-message', 'dingDong() announce(%s)', announcement)

      const room = wechaty.Room.load(CHATOPS_ROOM_ID)
      await room.announce(announcement)
    }

  }
}
