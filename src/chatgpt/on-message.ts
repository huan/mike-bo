import type { Wechaty, Message } from 'wechaty'
import { ChatGPTAPIBuilder } from './chatgpt-api-builder.js'

const chatGptApi = await ChatGPTAPIBuilder()

const MAX_FREEMIUM_NUM = 3
const MAX_PREMIUM_NUM_NOTICE = '发个红包热闹一下吧！'

const users = {} as Record<string, number>
const sponsors = {} as Record<string, boolean>

export async function onMessage (this: Wechaty, message: Message): Promise<void> {
  const room = message.room()
  if (!room) return

  // const topic = await room.topic()
  // if (!/ChatGPT/.test(topic)) return

  /**
   * Check red packet
   */
  const talker = message.talker()
  if (message.type() === this.Message.Type.RedEnvelope) {
    sponsors[talker.id] = true
  }

  if (!(await message.mentionSelf())) return

  /**
   * Check freemium
   */
  const counter = users[talker.id] || 0
  users[talker.id] = counter + 1

  if (counter >= MAX_FREEMIUM_NUM) {
    if (!sponsors[talker.id]) {
      await room.say(MAX_PREMIUM_NUM_NOTICE, talker)
      return
    }
  }

  /**
   * Only response in a room with "ChatGPT" in the topic and mentioned self
   */
  const text = await message.mentionText()

  // send a message and wait for the response
  const response = await chatGptApi.ask(text)

  const fullText = [
    talker.name() + ': ' + text,
    '-----',
    'ChatGPT: ' + response || 'No response',
  ].join('\n')

  await room.say(fullText)
}
