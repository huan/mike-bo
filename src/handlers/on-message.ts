import moment from 'moment'

import {
  log,
  Message,
  Wechaty,
  FileBox,
}             from 'wechaty'

import {
  CHATOPS_ROOM_ID,
}                   from '../config'

import {
  Chatops,
}           from '../chatops'

import { Wtmp } from '../wtmp'
import { VoteManager } from '../vote-manager'

export default async function onMessage (
  this    : Wechaty,
  message : Message,
): Promise<void> {
  log.info('on-message', 'onMessage(%s)', message)

  try {
    await VoteManager.instance().checkVote(message)
  } catch (e) {
    log.error('on-message', 'Failed to check vote for the message: %s', e)
  }

  await directMessage(message)
  await mentionMessage(message)

  await ctpStatus(this, message)

  await dingDong(this, message)
  await adminRoom(message)

}

async function adminRoom (
  message: Message,
): Promise<void> {
  if (message.self()) {
    return
  }

  const room = message.room()
  if (!room) {
    return
  }

  // ChatOps - Mike BO
  if (room.id !== CHATOPS_ROOM_ID) {
    return
  }

  const text = await message.mentionText()
  if (!text.match(/^#\w+/)) {
    return
  }

  const cmd = text.replace(/^#/, '')

  let reply = 'unknown cmd'
  if (cmd.match(/^wechatyAnnounce /i)) {
    const announcement = cmd.replace(/^wechatyAnnounce /, '')
    await Chatops.instance()
      .wechatyAnnounce(announcement)
    reply = 'announced.'
  }

  await message.say(reply)
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
    const wtmp = Wtmp.instance()
    const first = wtmp.first()
    const time = moment(first.login).fromNow()
    reply = `I'm online since ${time}`
  } else if (cmd.match(/^last$/i)) {
    const wtmp = Wtmp.instance()
    const list = wtmp.list()
    reply = ''
    for (const entry of list) {
      const loginText = moment(entry.login).format('MMM Do HH:mm')
      const logoutText = moment(entry.logout || Date.now()).format('MMM Do HH:mm')
      reply += `\n${entry.name}\n${loginText}\n${logoutText}\n`
    }
  } else if (cmd.match(/^whoru$/i)) {
    const puppet = wechaty.puppet

    const wtmp = Wtmp.instance()
    const first = wtmp.first()
    const time = moment(first.login).fromNow()

    reply = [
      `My name is ${wechaty.name()}, I borned at ${time}.`,
      `My Wechaty is ${wechaty}@${wechaty.version()}.`,
      `My puppet is ${puppet}@${puppet.version()}.`,
    ].join('\n')
  } else {
    reply = 'unknown CTP command'
  }

  await message.say(reply)
  await wechaty.sleep(1)
}

async function directMessage (
  message: Message,
): Promise<void> {
  const room = message.room()
  if (room) {
    return
  }

  // direct message
  await Chatops.instance().say(message)
}

async function mentionMessage (
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

  await Chatops.instance().say(message)
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
    } else if (text.match(/^#roomQRCode /i)) {
      const topic = text.replace(/^#roomQRCode /i, '')
      log.info('on-message', 'dingDong() roomQRCode(%s)', topic)

      const room = await wechaty.Room.find({ topic })
      if (room) {
        const value = await room.qrcode()
        const qrCodeFileBox = await FileBox.fromQRCode(value)
        await message.say(qrCodeFileBox)
      } else {
        await message.say(`room not found for "${topic}"`)
      }
    } else if (text.match(/^#announce /i)) {
      const announcement = text.replace(/^#announce /i, '')
      log.info('on-message', 'dingDong() announce(%s)', announcement)

      const room = wechaty.Room.load('5611663299@chatroom')
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
  log.verbose('on-message', 'ctpTranslate(%s)', text)

  const CTP_TRANSLATE_ROOM_ID     = '19661094471@chatroom'  // Chat Transport Protocol - CTP
  const CTP_TRANSLATE_CONTACT_ID  = 'wxid_sxrxy0q048ad12'   // 彩云小译9号

  const room      = wechaty.Room.load(CTP_TRANSLATE_ROOM_ID)
  const ctpMaster = wechaty.Contact.load(CTP_TRANSLATE_CONTACT_ID)

  await room.ready()
  await ctpMaster.ready()

  return new Promise(async (resolve, reject) => {

    const onCtpMessage = async (message: Message) => {
      log.verbose('on-message', 'ctpTranslate() onCtpMessage(%s)', message)

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
      log.verbose('on-message', 'ctpTranslate() timeout')

      room.removeListener('message', onCtpMessage)
      reject(new Error('timeout'))
    }

    room.addListener('message', onCtpMessage)
    await room.say(text, ctpMaster)
    setTimeout(timeoutFn, 15 * 1000)
  })
}
