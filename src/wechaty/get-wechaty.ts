import {
  Wechaty,
  Contact,
  log,
}                 from 'wechaty'

import { pluginList }       from '../plugins/mod'
import { vorpalPluginList } from '../vorpals/mod'

import { Wtmp }     from '../wtmp'

import {
  getMemory,
}               from './get-memory'

let wechaty: Wechaty

export function getWechaty (name?: string): Wechaty {
  log.verbose('getWechaty', 'getWechaty(%s)', name || '')

  if (wechaty) {
    return wechaty
  }

  if (!name) {
    throw new Error('init wechaty need a name')
  }
  const memory = getMemory(name)

  wechaty = Wechaty.instance({
    memory,
    name,
  })

  wechaty.use(
    ...pluginList,
    ...vorpalPluginList,
  )

  const wtmp = Wtmp.instance()
  const loginWtmp = (user: Contact) => wtmp.login(user.name())
  const logoutWtmp = (user: Contact) => wtmp.logout(user.name())
  wechaty.on('login', loginWtmp)
  wechaty.on('logout', logoutWtmp)

  return wechaty
}
