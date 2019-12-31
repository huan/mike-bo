import {
  Wechaty,
  Message,
  UrlLink,
}             from 'wechaty'

import {
  log,
  WECHATY_DEVELOPERS_HOME_ROOM_ID_LIST,
}                                         from './config'

const BOT_ROOM_ID       = '5611663299@chatroom'   // 'ChatOps - Mike BO'
const HEARTBEAT_ROOM_ID = '17376996519@chatroom'  // 'ChatOps - Heartbeat'

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

  private constructor (
    private bot: Wechaty,
  ) {
    //
  }

  public async heartbeat (text: string): Promise<void> {
    return this.roomMessage(HEARTBEAT_ROOM_ID, text)
  }

  public async say (textOrMessage: string | Message) {
    return this.roomMessage(BOT_ROOM_ID, textOrMessage)
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
    await room.ready()

    if (typeof info === 'string') {
      await room.say(info)
    } else if (info instanceof Message) {
      switch (info.type()) {
        case Message.Type.Text:
          await room.say(`${info}`)
          break
        case Message.Type.Image:
          const image = await info.toFileBox()
          await room.say(image)
          break
        case Message.Type.Url:
          const urlLink = await info.toUrlLink()
          await room.say(urlLink)
          break
        default:
          const typeName = Message.Type[info.type()]
          await room.say(`message type: ${typeName}`)
          break
      }
    } else if (info instanceof UrlLink) {
      await room.say(info)
    } else {
      throw new Error('not supported message.')
    }

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
        await room.ready()
        await room.announce(announcement)
      } catch (e) {
        log.error('Chatops', 'wechatyAnnounce() rejection: %s', e)
      }
    }
  }

}
