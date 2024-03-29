import express from 'express'
import bodyParser from 'body-parser'

import {
  Wechaty,
  log,
}                 from 'wechaty'

import {
  PORT,
  VERSION,
}             from '../config.js'

export async function startWeb (bot: Wechaty): Promise<void> {
  log.verbose('startWeb', 'startWeb(%s)', bot)

  let qrcodeValue : undefined | string
  let userName    : undefined | string

  const rootHandler = (_req: express.Request, res: express.Response) => {
    let html
    if (qrcodeValue) {
      html = [
        `<h1>Mike BO v${VERSION}</h1>`,
        `<a href='https://wechaty.js.org/qrcode/${encodeURIComponent(qrcodeValue)}' target='_blank'>Click to scan QR Code to log in the bot</a>`,
      ].join('')
    } else if (userName) {
      html = `Mike BO v${VERSION} User ${userName} logined`
    } else {
      html = `Mike BO v${VERSION} Hello, come back later please.`
    }

    res.setHeader('content-type', 'text/html')

    res.end([
      html,
      '<hr />',
      '<a href="https://dashboard.heroku.com/apps/mike-bo/logs" target="_blank">Logs</a>',
      '<br />',
      '<a href="/restart/">Restart Bot</a>',
    ].join(''))
  }

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

  const app = express()

  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  app.use(bodyParser.raw())

  app.get('/', rootHandler)

  // http.createServer(app).listen(PORT)
  app.listen(PORT, () => log.verbose('startWeb', 'startWeb() listening at http://localhost:%d', PORT))
}
