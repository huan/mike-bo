import type { Wechaty, Message } from 'wechaty'
import { ChatGPTAPIBuilder } from './chatgpt-api-builder.js'

const chatGptApi = await ChatGPTAPIBuilder()

const DEFAULT_CREDIT = 1
const MAX_PREMIUM_NUM_NOTICE = '发个红包热闹一下吧！'

const credits = {} as Record<string, number>

export async function onMessage (this: Wechaty, message: Message): Promise<void> {
  const room = message.room()
  if (!room) return

  // const topic = await room.topic()
  // if (!/ChatGPT/.test(topic)) return

  const talker = message.talker()
  const credit = credits[talker.id] || 0

  /**
   * Check red packet
   */
  if (message.type() === this.Message.Type.RedEnvelope) {
    credits[talker.id] = (credits[talker.id] || 0) + 1
    return
  }

  if (!(await message.mentionSelf())) return

  /**
   * Check freemium
   */
  if (credit <= 0 - DEFAULT_CREDIT) {
    await room.say(MAX_PREMIUM_NUM_NOTICE, talker)
    return
  }
  credits[talker.id] = credit - 1

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
