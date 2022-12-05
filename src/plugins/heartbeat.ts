import { Heartbeat } from 'wechaty-plugin-contrib'

import { HEARTBEAT_ROOM_ID } from '../database.js'

export const HeartbeatPlugin = Heartbeat({
  emoji: {
    heartbeat : '[爱心]',
    login     : '[太阳]',
    logout    : '[月亮]',
    ready     : '[拳头]',
  },
  intervalSeconds: 60 * 60,       // 1 hour
  room: HEARTBEAT_ROOM_ID,
})
