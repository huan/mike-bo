import Hapi, { Request, ResponseToolkit }    from '@hapi/hapi'
import {
  Wechaty,
  UrlLink,
}               from 'wechaty'
import {
  UrlLinkPayload,
}                   from 'wechaty-puppet'

import {
  log,
  PORT,
  VERSION,
}             from './config'

import { Chatops } from './chatops'

async function wechatyBroadcastHandler (
  request: Request,
  h: ResponseToolkit,
) {
  log.info('startWeb', 'webhookHandler()')

  let payload: UrlLinkPayload & { mikeboSecret?: string }

  switch (request.method) {
    case 'get':
      payload = { ...request.query } as any
      break

    case 'post':
      payload = request.payload as any
      break

    default:
      throw Error(`method is neither get nor post: ${request.method}`)
  }

  if (!payload.description || !payload.thumbnailUrl  || !payload.title || !payload.url) {
    return h.response(`payload illegal: "${JSON.stringify(payload)}"`)
  }

  if (!payload.mikeboSecret || payload.mikeboSecret !== process.env.MIKEBO_SECRET) {
    return h.response(`mikebo secret illegal: please check MIKEBO_SECRET env variable.`)
  }

  const urlLink = new UrlLink(payload)

  await Chatops
    .instance()
    .wechatyBroadcast(urlLink)

  const html = [
    'webhook succeed!',
    JSON.stringify(payload),
  ].join('<hr />')

  return h.response(html)
}

async function chatopsHandler (request: Request, response: ResponseToolkit) {
  log.info('startWeb', 'chatopsHandler()')

  const payload: {
    chatops: string,
  } = request.payload as any

  await Chatops.instance().say(payload.chatops)

  return response.redirect('/')
}

export async function startWeb (bot: Wechaty): Promise<void> {
  log.verbose('startWeb', 'startWeb(%s)', bot)

  let qrcodeValue : undefined | string
  let userName    : undefined | string

  const server =  new Hapi.Server({
    port: PORT,
  })

  const rootHandler = () => {
    let html
    if (qrcodeValue) {
      html = [
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
    } else if (userName) {
      html = `Mike BO v${VERSION} User ${userName} logined`
    } else {
      html = `Mike BO v${VERSION} Hello, come back later please.`
    }
    return [
      html,
      '<hr />',
      '<a href="https://dashboard.heroku.com/apps/mike-bo/logs" target="_blank">Logs</a>',
    ].join('')
  }

  const rootRoute = {
    handler: rootHandler,
    method : 'GET',
    path   : '/',
  }

  const chatopsRoute = {
    handler: chatopsHandler,
    method : 'POST',
    path   : '/chatops/',
  }

  const wechatyBroadcastRoute = {
    handler: wechatyBroadcastHandler,
    method : ['GET', 'POST'],
    path   : '/wechaty/',
  }

  const routeList = [
    rootRoute,
    chatopsRoute,
    wechatyBroadcastRoute,
  ]

  server.route(routeList)

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
