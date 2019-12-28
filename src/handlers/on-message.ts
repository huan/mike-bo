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

import { WTmp } from '../wtmp'

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

  const text = await message.mentionText()
  if (!text.match(/^#\w+/)) {
    return
  }

  const cmd = text.replace(/^#/, '')

  let reply
  if (cmd.match(/^ding$/i)) {
    reply = 'dong'
  } else if (cmd.match(/^uptime$/i)) {
    const wtmp = WTmp.instance()
    const first = wtmp.first()
    const time = moment(first.login).fromNow()
    reply = `I'm online since ${time}`
  } else if (cmd.match(/^last$/i)) {
    const wtmp = WTmp.instance()
    const list = wtmp.list()
    reply = ''
    for (const entry of list) {
      const loginText = moment(entry.login).format('MMM Do HH:mm')
      const logoutText = moment(entry.logout || Date.now()).format('MMM Do HH:mm')
      reply += `\n${entry.name}\n${loginText}\n${logoutText}\n`
    }
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
  await chatops(wechaty, message)
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
  const from = message.from()
  const mentionSelf = await message.mentionSelf()

  if (!from) {
    return
  }

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
    } else if (text.match(/^#findContact /i)) {
      const name = text.replace(/^#findContact /i, '')
      log.info('on-message', 'dingDong() findContact(%s)', name)

      const contact = await wechaty.Contact.find({ name })
      if (contact) {
        await message.say(`contact id: "${contact.id}"`)
      } else {
        await message.say(`contACT not found for "${name}"`)
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
    } else if (text.match(/^#translate /i)) {
      const sentence = text.replace(/^#translate /i, '')
      log.info('on-message', 'dingDong() translate(%s)', sentence)

      try {
        const translated = await ctpTranslate(wechaty, sentence)
        const output = `translate output: "${translated}"`

        if (room) {
          await message.say(output, from)
        } else {
          await message.say(output)
        }

      } catch (e) {
        await message.say(`${e}`)
      }
    }

  }
}

async function ctpTranslate (
  wechaty: Wechaty,
  text: string,
): Promise<string> {

  // Chat Transport Protocol - CTP
  const CTP_TRANSLATE_ROOM_ID = '19661094471@chatroom'
  const CTP_TRANSLATE_CONTACT_ID = 'wxid_sxrxy0q048ad12'

  const room      = wechaty.Room.load(CTP_TRANSLATE_ROOM_ID)
  const ctpMaster = wechaty.Contact.load(CTP_TRANSLATE_CONTACT_ID)

  return new Promise(async (resolve, reject) => {

    const onCtpMessage = async (message: Message) => {
      const from = message.from()
      if (!from) {
        return
      }

      if (from.id !== ctpMaster.id) {
        return
      }

      // const mentionSelf = await message.mentionSelf()
      // if (!mentionSelf) {
      //   return
      // }

      room.removeListener('message', onCtpMessage)

      const mentionText = await message.mentionText()
      resolve(mentionText)
    }

    const timeoutFn = () => {
      room.removeListener('message', onCtpMessage)
      reject(new Error('timeout'))
    }

    room.addListener('message', onCtpMessage)
    await room.say(text, ctpMaster)
    setTimeout(timeoutFn, 10 * 1000)

  })
}
