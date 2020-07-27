import { DingDong } from 'wechaty-plugin-contrib'
// import { CHATOPS_ROOM_ID } from '../database'

export const DingDongPlugin = DingDong({
  contact : true,
  mention : false,
  room    : [
    /ChatOps/i,
  ],
})
