import {
  Contact,
  log,
  Wechaty,
}             from 'wechaty'

export default async function onLogout (
  this : Wechaty,
  user : Contact,
): Promise<void> {
  console.info('onLogout() enter')
  log.info('on-logout', `onLogout(%s)`, user)
  console.info('onLogout() exit')
}
