import {
  log,
  Message,
  Wechaty,
}             from 'wechaty'
import { FileBox } from 'file-box'
import { onMessage as onChatGptMessage } from '../chatgpt/mod.js'

export default async function onMessage (
  this    : Wechaty,
  message : Message,
): Promise<void> {
  log.info('on-message', 'onMessage(%s)', message)

  await dingDong(this, message)

  await onChatGptMessage.call(this, message)
}

async function dingDong (
  wechaty: Wechaty,
  message: Message,
) {
  log.info('on-message', 'dingDong()')

  let text      = message.text()
  const type    = message.type()
  const room    = message.room()
  const talker  = message.talker()
  const mentionSelf = await message.mentionSelf()

  if (room) {
    if (!mentionSelf) {
      return
    }

    log.info('on-message', 'dingDong() message in room and mentioned self')
    text = await message.mentionText()
    console.info('mentionText', text)
  }

  if (type === wechaty.Message.Type.Text) {
    if (text.match(/^#ding$/i)) {
      await message.say('dong')
    } else if (text.match(/^#roomQRCode /i)) {
      const topic = text.replace(/^#roomQRCode /i, '')
      log.info('on-message', 'dingDong() roomQRCode(%s)', topic)

      const room = await wechaty.Room.find({ topic })
      if (room) {
        const value = await room.qrCode()
        const qrCodeFileBox = await FileBox.fromQRCode(value)
        await message.say(qrCodeFileBox)
      } else {
        await message.say(`room not found for "${topic}"`)
      }
    } else if (text.match(/^#announce /i)) {
      const announcement = text.replace(/^#announce /i, '')
      log.info('on-message', 'dingDong() announce(%s)', announcement)

      // const room = wechaty.Room.load('5611663299@chatroom')
      // await room.announce(announcement)
    } else if (text.match(/^#translate /i)) {
      const sentence = text.replace(/^#translate /i, '')
      log.info('on-message', 'dingDong() translate(%s)', sentence)

      try {
        const translated = await ctpTranslate(wechaty, sentence)
        const output = `translate output: "${translated}"`

        if (room) {
          await room.say(output, talker)
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

  const room      = (wechaty.Room as any).load(CTP_TRANSLATE_ROOM_ID)
  const ctpMaster = (wechaty.Contact as any).load(CTP_TRANSLATE_CONTACT_ID)

  await room.ready()
  await ctpMaster.ready()

  return new Promise((resolve, reject) => {

    const onCtpMessage = async (message: Message) => {
      log.verbose('on-message', 'ctpTranslate() onCtpMessage(%s)', message)

      const talker = message.talker()

      if (talker.id !== ctpMaster.id) {
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
    room.say(text, ctpMaster).catch(() => {})
    setTimeout(timeoutFn, 15 * 1000)
  })
}
