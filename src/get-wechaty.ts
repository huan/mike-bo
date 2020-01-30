import {
  Wechaty,
}                 from 'wechaty'

import {
  log,
}               from './config'
import {
  getMemory,
}               from './get-memory'
import {
  Chatops,
}               from './chatops'

let wechaty: Wechaty

export function getWechaty (name: string): Wechaty {
  log.verbose('getWechaty', 'getWechaty(%s)', name)

  if (wechaty) {
    return wechaty
  }

  const memory = getMemory(name)

  wechaty = Wechaty.instance({
    memory,
    name,
  })

  // Initialize Chatops Instance:
  Chatops.instance(wechaty)

  return wechaty
}
