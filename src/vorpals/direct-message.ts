import {
  WechatyVorpal,
  WechatyVorpalConfig,
}                         from 'wechaty-vorpal'
import {
  Version,
  Whoru,
}                         from 'wechaty-vorpal-contrib'

const dmConfig: WechatyVorpalConfig = {
  contact : true,
  room    : false,
  silent  : true,

  use: [
    Whoru(),
    Version(),
  ],
}

const DirectMessageVorpalPlugin = WechatyVorpal(dmConfig)

export {
  DirectMessageVorpalPlugin,
}
