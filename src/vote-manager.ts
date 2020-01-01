import { Message } from 'wechaty'
import LRUCache  from 'lru-cache'

import {
  log,
}           from './config'

export interface VotePayload {
  count       : number,
  voterIdList : string[],
}

const VOTE_KEY = [
  '[弱]',
  '/:MMWeak',
]

const DEFAULT_VOTE_THRESHOLD = 3

const MANAGED_ROOM_TOPIC_REGEX_LIST = [
  /Wechaty Developers' Home/i,
  /Wechaty Ignite/i,
]

export class VoteManager {

  private static singleton: VoteManager

  public static instance () {
    if (!this.singleton) {
      this.singleton = new VoteManager()
    }

    return this.singleton
  }

  /**
   * Static
   *
   * ////////
   *
   * Instance
   */

  private readonly voteMemory: LRUCache<string, VotePayload>

  constructor () {
    const lruOptions: LRUCache.Options<string, VotePayload> = {
      // length: function (n) { return n * 2},
      dispose (key, val) {
        log.silly('VoteManager', 'constructor() lruOptions.dispose(%s, %s)', key, JSON.stringify(val))
      },
      max: 1000,
      maxAge: 60 * 60 * 1000,
    }

    this.voteMemory = new LRUCache<string, VotePayload>(lruOptions)
  }

  /**
   * @param message
   * @description Check whether the message is a vote message
   */
  public async checkVote (message: Message) {
    log.verbose('VoteManager', 'checkVote(%s)', message)

    const room = message.room()
    const from = message.from()

    if (!room || !from || message.type() !== Message.Type.Text) {
      return
    }

    const topic = await room.topic()
    const isManaged = MANAGED_ROOM_TOPIC_REGEX_LIST.some(regex => regex.test(topic))
    if (!isManaged) {
      return
    }

    const mentionList = await message.mentionList()
    if (!mentionList || mentionList.length === 0) {
      return
    }

    const mentionText = await message.mentionText()
    const isKeyword = VOTE_KEY.includes(mentionText)
    if (!isKeyword) {
      return
    }

    for (const mention of mentionList) {
      if (mention.id === message.wechaty.self().id) {
        return
      }

      const KEY = `${room.id}-${mention.id}-voteDown`
      let payload = this.voteMemory.get(KEY)
      if (!payload) {
        payload = {
          count: 1,
          voterIdList: [mention.id],
        }
        this.voteMemory.set(KEY, payload)
      }

      const { count, voterIdList } = payload

      const hasVoted = voterIdList.includes(from.id)
      if (hasVoted) {
        await from.say(`You have already voted down ${from.name()} before.`)
      } else {
        await from.say(
          [
            `You voted down ${from.name()} in room ${topic}.`,
            `The one who has been voted down by more than three room members`,
            'will be removed out from the room as an unwelcome guest.',
          ].join(' ')
        )
      }

      await room.say`${mention} have been voted down by ${from}.`
      this.voteMemory.set(KEY, {
        count: count + 1,
        voterIdList: [...voterIdList, from.id],
      })

      if (count > DEFAULT_VOTE_THRESHOLD) {
        const voterContactList = voterIdList.map(id => message.wechaty.Contact.load(id))
        await Promise.all(
          voterContactList.map(c => c.ready())
        )
        const nameList = voterContactList.map(c => c.name())
        const nameText = '@' + nameList.join(', @')

        await room.say`UNWELCOME GUEST FOUND: ${mention}\n You will be moved out of this room because ${nameText} have voted you down.`
        await room.del(mention)
        this.voteMemory.del(KEY)
      }
    }
  }

}
