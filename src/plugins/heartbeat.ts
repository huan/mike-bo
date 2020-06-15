import { Heartbeat } from 'wechaty-plugin-contrib'

export const HeartbeatPlugin = Heartbeat({
  emoji: {
    heartbeat : '[爱心]',
    login     : '[太阳]',
    logout    : '[月亮]',
    ready     : '[拳头]',
  },
  intervalSeconds: 60 * 60,       // 1 hour
  room: '17376996519@chatroom',   // 'ChatOps - Heartbeat'
})
