import {
  Wechaty,
  Message,
  UrlLink,
  FileBox,
}             from 'wechaty'

import { DelayQueueExecutor } from 'rx-queue'

import {
  log,
  WECHATY_DEVELOPERS_HOME_ROOM_ID_LIST,
  CHATOPS_ROOM_ID,
  HEARTBEAT_ROOM_ID,
}                                         from './config'

export class Chatops {

  private static singleton: Chatops

  public static instance (
    bot?: Wechaty,
  ) {
    if (!this.singleton) {
      if (!bot) {
        throw new Error('instance need a Wechaty instance to initialize')
      }
      this.singleton = new Chatops(bot)
    }
    return this.singleton
  }

  /**
   * Static
   * --------
   * Instance
   */

  private delayQueueExecutor: DelayQueueExecutor

  private constructor (
    private bot: Wechaty,
  ) {
    this.delayQueueExecutor = new DelayQueueExecutor(5 * 1000)  // set delay period time to 5 seconds
  }

  public async heartbeat (text: string): Promise<void> {
    return this.roomMessage(HEARTBEAT_ROOM_ID, text)
  }

  public async say (textOrMessage: string | Message) {
    return this.roomMessage(CHATOPS_ROOM_ID, textOrMessage)
  }

  private async roomMessage (
    roomId: string,
    info:   string | Message | UrlLink,
  ): Promise<void> {
    log.info('Chatops', 'roomMessage(%s, %s)', roomId, info)

    const online = this.bot.logonoff()
    if (!online) {
      log.error('Chatops', 'roomMessage() this.bot is offline')
      return
    }

    const room = this.bot.Room.load(roomId)
    // await room.ready()

    let something: string | FileBox | UrlLink

    if (typeof info === 'string') {
      something = info
    } else if (info instanceof Message) {
      switch (info.type()) {
        case Message.Type.Text:
          something = `${info}`
          break
        case Message.Type.Image:
          something = await info.toFileBox()
          break
        case Message.Type.Url:
          something = await info.toUrlLink()
          break
        default:
          const typeName = Message.Type[info.type()]
          something = `message type: ${typeName}`
          break
      }
    } else if (info instanceof UrlLink) {
      something = info
    } else {
      throw new Error('not supported message.')
    }

    await this.queue(
      () => room.say(something as any),
      'roomSay',
    )
  }

  public async wechatyBroadcast (info: string | UrlLink) {
    for (const roomId of WECHATY_DEVELOPERS_HOME_ROOM_ID_LIST) {
      try {
        await this.roomMessage(roomId, info)
      } catch (e) {
        log.error('Chatops', 'wechatyBroadcast() rejection: %s', e)
      }
    }
  }

  public async wechatyAnnounce (announcement: string) {
    for (const roomId of WECHATY_DEVELOPERS_HOME_ROOM_ID_LIST) {
      const room = this.bot.Room.load(roomId)
      try {
        // await room.ready()
        await this.queue(
          () => room.announce(announcement),
          'announcement',
        )
      } catch (e) {
        log.error('Chatops', 'wechatyAnnounce() rejection: %s', e)
      }
    }
  }

  public async queue (
    fn: (() => any),
    name?: string,
  ) {
    log.verbose('Chatops', 'queue(,"%s")', name)
    await this.delayQueueExecutor.execute(fn, name)
    log.verbose('Chatops', 'queue(,"%s") done.', name)
  }

}
