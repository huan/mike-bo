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
      if (mention.id === message.wechaty.userSelf().id) {
        return
      }

      const KEY = `${room.id}-${mention.id}-voteDown`
      let payload = this.voteMemory.get(KEY)
      if (!payload) {
        payload = {
          count: 1,
          voterIdList: [from.id],
        }
        this.voteMemory.set(KEY, payload)
      }

      const hasVoted = payload.voterIdList.includes(from.id)
      if (hasVoted) {
        await room.say`${from} You have already voted. There need not to vote down ${mention} for more than once.`
      } else {
        payload.count++
        payload.voterIdList = [...new Set([
          ...payload.voterIdList,
          from.id,
        ])]

        this.voteMemory.set(KEY, payload)
      }

      const voterContactList = payload.voterIdList.map(id => message.wechaty.Contact.load(id))
      await Promise.all(
        voterContactList.map(c => c.ready())
      )
      const nameList = voterContactList.map(c => c.name())
      const nameText = '@' + nameList.join(', @')

      await room.say`[VOTE DOWN] ${mention} (Total: ${payload.count} times).\nThe one who has been voted down by three people will be removed from the room as an unwelcome guest.\nVOTERS: ${nameText}.`

      if (payload.count >= DEFAULT_VOTE_THRESHOLD) {

        await room.say`UNWELCOME GUEST FOUND: ${mention}\nThank you ${nameText} for voting for the community, we apprecate it.\nThanks for everyone in this room for keeping topic stick to Wechaty & Chatbot technology.\n`
        await room.del(mention)
        this.voteMemory.del(KEY)
      }
    }
  }

}
