import Hapi    from '@hapi/hapi'
import {
  Wechaty,
}               from 'wechaty'

import {
  log,
  PORT,
  VERSION,
}             from './config'

export async function startWeb (bot: Wechaty): Promise<void> {
  log.verbose('startWeb', 'startWeb(%s)', bot)

  let qrcodeValue : undefined | string
  let userName    : undefined | string

  const server =  new Hapi.Server({
    port: PORT,
  })

  const handler = () => {
    if (qrcodeValue) {
      const html = [
        `<h1>Mike BO v${VERSION}</h1>`,
        'Scan QR Code: <br />',
        qrcodeValue + '<br />',
        '<a href="http://goqr.me/" target="_blank">http://goqr.me/</a><br />',
        '\n\n',
        '<image src="',
        'https://api.qrserver.com/v1/create-qr-code/?data=',
        encodeURIComponent(qrcodeValue),
        '">',
      ].join('')
      return html
    } else if (userName) {
      return `Mike BO v${VERSION} User ${userName} logined`
    } else {
      return `Mike BO v${VERSION} Hello, come back later please.`
    }
  }

  server.route({
    handler,
    method : 'GET',
    path   : '/',
  })

  bot.on('scan', qrcode => {
    qrcodeValue = qrcode
    userName    = undefined
  })
  bot.on('login', user => {
    qrcodeValue = undefined
    userName    = user.name()
  })
  bot.on('logout', () => {
    userName = undefined
  })

  await server.start()
  log.info('startWeb', 'startWeb() listening to http://localhost:%d', PORT)
}
