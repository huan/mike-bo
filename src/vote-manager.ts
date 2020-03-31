import {
  Message,
  Room,
  Contact,
}             from 'wechaty'
import LRUCache  from 'lru-cache'

import {
  log,
}           from './config'

import {
  Chatops,
}           from './chatops'

export interface VotePayload {
  downCounter : number,
  downIdList  : string[],

  upCounter : number,
  upIdList  : string[],
}

const EMOJI_THUMB_UP    = '[ThumbsUp]'
const EMOJI_THUMB_DOWN  = '[ThumbsDown]'

const VOTE_DOWN_EMOJI_LIST = [
  '[弱]',
  '/:MMWeak',
  EMOJI_THUMB_DOWN,
]

const VOTE_UP_EMOJI_LIST = [
  '[强]',
  '/:MMStrong',
  EMOJI_THUMB_UP,
]

// [炸弹]

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

  private async validVote (message: Message): Promise<boolean> {
    // log.verbose('VoteManager', 'validVote(%s)', message)

    const room = message.room()
    const from = message.from()

    if (!room || !from || message.type() !== Message.Type.Text) {
      return false
    }

    const topic = await room.topic()
    const isManaged = MANAGED_ROOM_TOPIC_REGEX_LIST.some(regex => regex.test(topic))
    if (!isManaged) {
      log.silly('VoteManager', 'validVote() not a managed room')
      return false
    }

    const mentionList = await message.mentionList()
    if (!mentionList || mentionList.length === 0) {
      log.silly('VoteManager', 'validVote() mentioned nobody, skipped')
      return false
    }

    for (const mention of mentionList) {
      if (mention.id === message.wechaty.userSelf().id) {
        log.silly('VoteManager', 'validVote() mentioned the bot, skipped')
        return false
      }
    }

    const mentionText = await message.mentionText()
    log.silly('VoteManager', 'validVote() mentionText="%s"', mentionText)

    const isVoteDown  = this.isVoteDown(mentionText)
    const isVoteUp    = this.isVoteUp(mentionText)

    const isVote      = isVoteDown || isVoteUp
    if (!isVote) {
      log.silly('VoteManager', 'validVote() not a vote message, skipped')
      return false
    }

    return true
  }

  private isVoteDown (text: string): boolean {
    log.silly('VoteManager', 'isVoteDown(%s)', text)
    return VOTE_DOWN_EMOJI_LIST.includes(text)
  }

  private isVoteUp (text: string): boolean {
    log.silly('VoteManager', 'isVoteUp(%s)', text)
    return VOTE_UP_EMOJI_LIST.includes(text)
  }

  /**
   * @param message
   * @description Check whether the message is a vote message
   */
  public async checkVote (message: Message) {
    // log.verbose('VoteManager', 'checkVote(%s)', message)

    const validVote = await this.validVote(message)
    if (!validVote) {
      return
    }

    const mentionText = await message.mentionText()

    if (this.isVoteDown(mentionText)) {
      return this.doVoteDown(message)
    } else if (this.isVoteUp(mentionText)) {
      return this.doVoteUp(message)
    }

  }

  private getVoteKey (
    room: Room,
    candidate: Contact,
  ): string {
    return `${room.id}-${candidate.id}-vote`
  }

  private getMemory (
    room: Room,
    candidate: Contact,
  ): VotePayload {
    const key = this.getVoteKey(room, candidate)
    let payload = this.voteMemory.get(key)

    if (!payload) {
      payload = {
        downCounter: 0,
        downIdList: [],
        upCounter: 0,
        upIdList: [],
      }
    }

    return payload
  }

  private setMemory (
    room: Room,
    candidate: Contact,
    payload?: VotePayload,
  ) {
    const key = this.getVoteKey(room, candidate)
    if (payload) {
      this.voteMemory.set(key, payload)
    } else {
      this.voteMemory.del(key)
    }
  }

  private async doVoteDown (
    message: Message,
  ): Promise<void> {
    const mentionList = await message.mentionList()

    const room = message.room()!
    const from = message.from()!

    for (const target of mentionList) {

      const payload = this.getMemory(room, target)

      const hadVoted = await this.hadVoted(
        payload.downIdList,
        from,
        target,
        room,
      )

      if (hadVoted) {
        continue
      }

      payload.downCounter++
      payload.downIdList = [...new Set(
        [
          ...payload.downIdList,
          from.id,
        ],
      )]
      this.setMemory(room, target, payload)

      await this.sayVoteStatus(payload, target, room)

      if (payload.downCounter - payload.upCounter >= DEFAULT_VOTE_THRESHOLD) {

        this.executeKick(payload, room, target)
          .catch(e => log.error('VoteManager', 'doVoteDown() executeKick() rejection: %s', e))

        this.setMemory(room, target, undefined)  // del
      }
    }
  }

  private async doVoteUp (
    message: Message,
  ): Promise<void> {
    const mentionList = await message.mentionList()

    const room = message.room()!
    const from = message.from()!

    for (const target of mentionList) {

      const payload = this.getMemory(room, target)

      const hadVoted = await this.hadVoted(
        payload.upIdList,
        from,
        target,
        room,
      )

      if (hadVoted) {
        continue
      }

      payload.upCounter++
      payload.upIdList = [...new Set([
        ...payload.upIdList,
        from.id,
      ])]
      this.setMemory(room, target, payload)

      await this.sayVoteStatus(payload, target, room)

    }
  }

  async mentionTextFromContactIdList (
    idList: string[],
    room: Room,
  ) {
    const uniqIdList = [...new Set([...idList])]

    const contactList = uniqIdList.map(
      id => room.wechaty.Contact.load(id)
    )
    await Promise.all(
      contactList.map(c => c.ready())
    )
    const mentionList = contactList.map(c => c.name())
    const mentionText = '@' + mentionList.join(' @')
    return mentionText
  }

  async hadVoted (
    voterIdList: string[],
    voter: Contact,
    target: Contact,
    room: Room,
  ) {
    const hasVoted = voterIdList.includes(voter.id)
    if (!hasVoted) {
      return false
    }

    const task = () => room.say`${voter} You can only vote ${target} once.`
    Chatops.instance().queue(
      task,
      'has-voted',
    ).catch(e => {
      log.error('Chatops', 'hadVoted() queue() rejection %s', e)
    })
    return true
  }

  private async sayVoteStatus (
    payload: VotePayload,
    target: Contact,
    room: Room,
  ): Promise<void> {
    // let emoji: string
    // switch (payload.downCounter) {
    //   case 0:
    //   case 1:
    //     emoji = '[Awkward]'
    //     break
    //   case 2:
    //     emoji = '[Panic]'
    //     break
    //   case 3:
    //     emoji = '[Angry]'
    //     break
    //   default:
    //     emoji = '[Bomb]'
    // }

    const numUp = payload.upCounter
    const numDown = payload.downCounter

    const upVotersMentionText = await this.mentionTextFromContactIdList(
      [...payload.upIdList],
      room,
    )
    const downVotersMentionText = await this.mentionTextFromContactIdList(
      [...payload.downIdList],
      room,
    )

    const voteStatus = `${EMOJI_THUMB_DOWN}-${numDown} | +${numUp}${EMOJI_THUMB_UP}`
    // const voteInfo = `The one who has been voted nagitive by three people will be removed from the room as an unwelcome guest.`
    const horizontalLine = '———————————'
    const voteRule = `The one who has been voted ${EMOJI_THUMB_DOWN} by three people will be removed from the room as an unwelcome guest.`
    let voteInfo = `${horizontalLine}\n${voteRule}\n\n`

    if (payload.upIdList.length) {
      voteInfo += `${EMOJI_THUMB_UP} By ${upVotersMentionText}\n`
    }
    if (payload.downIdList.length) {
      voteInfo += `${EMOJI_THUMB_DOWN} By ${downVotersMentionText}\n`
    }

    const task = () => room.say`${target} : ${voteStatus}\n${voteInfo}`
    Chatops.instance().queue(task, 'sayVoteStatus')
      .catch(e => log.error('Chatops', 'sayVoteStatus() queue() rejection: %s', e))
  }

  private async executeKick (
    payload: VotePayload,
    room: Room,
    target: Contact,
  ) {
    const votersMentionText = await this.mentionTextFromContactIdList(payload.downIdList, room)
    // const announcement =
    const task = async () => {
      await room.say`UNWELCOME GUEST CONFIRMED:\n[Dagger] ${target} [Cleaver]\n\nThank you [Rose] ${votersMentionText} [Rose] for voting for the community, we apprecate it.\n\nThanks everyone in this room for respecting our CODE OF CONDUCT.\n`
      await room.wechaty.sleep(5 * 1000)
      await room.say`Removing ${target} out to this room ...`
      await room.wechaty.sleep(5 * 1000)
      await room.del(target)
      await room.wechaty.sleep(5 * 1000)
      await room.say`Done.`
    }

    await Chatops.instance().queue(
      task,
      'vote-manager-execute',
    )
  }

}
