import type { Wechaty, Message } from 'wechaty'
import { ChatGPTAPIBuilder } from './chatgpt-api-builder.js'

const chatGptApi = await ChatGPTAPIBuilder()

export async function onMessage (this: Wechaty, message: Message): Promise<void> {
  const room = message.room()
  if (!room) return

  const topic = await room.topic()
  if (!/ChatGPT/.test(topic)) return

  if (!(await message.mentionSelf())) return

  /**
   * Only response in a room with "ChatGPT" in the topic and mentioned self
   */
  const text = await message.mentionText()

  // send a message and wait for the response
  const response = await chatGptApi.sendMessage(text)

  // response is a markdown-formatted string
  if (response) {
    await room.say(response)
  } else {
    await room.say('No response')
  }
}
