import { DingDong } from 'wechaty-plugin-contrib'
// import { CHATOPS_ROOM_ID } from '../database'

export const DingDongPlugin = DingDong({
  mention : true,
  room    : true, // CHATOPS_ROOM_ID,
})
