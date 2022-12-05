import {
  type Wechaty,
  WechatyBuilder,
  log,
}                 from 'wechaty'

import { pluginList }       from '../plugins/mod.js'
import { vorpalPluginList } from '../vorpals/mod.js'
import { registerHandlers } from '../handlers/mod.js'

// import { Wtmp }     from '../wtmp'

import { getMemory }        from './get-memory.js'

let wechaty: undefined | Wechaty

export function getWechaty (name?: string): Wechaty {
  log.verbose('getWechaty', 'getWechaty(%s)', name || '')

  if (wechaty) {
    return wechaty
  }

  if (!name) {
    throw new Error('init wechaty need a name')
  }
  const memory = getMemory(name)

  wechaty = WechatyBuilder.build({
    memory,
    name,
  })

  registerHandlers(wechaty)

  wechaty.use(
    ...pluginList,
    ...vorpalPluginList,
  )

  // const wtmp = Wtmp.instance()
  // const loginWtmp = (user: Contact) => wtmp.login(user.name())
  // const logoutWtmp = (user: Contact) => wtmp.logout(user.name())
  // wechaty.on('login', loginWtmp)
  // wechaty.on('logout', logoutWtmp)

  return wechaty
}
