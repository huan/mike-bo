/**
 * To make ts-node happy without --files args
 * Note: this <reference ... /> must be put before all code, or it will be ignored.
 */
/// <reference path="./typings.d.ts" />

/**
 * VERSION
 */
import readPkgUp from 'read-pkg-up'

export {
  log,
}               from 'brolog'

const pkg = readPkgUp.sync({ cwd: __dirname })!.packageJson
export const VERSION = pkg.version

/**
 * Env Vars
 */
export const PORT = process.env.PORT || 8788

/**
 * Wechaty Developers' Home
 */
export const WECHATY_DEVELOPERS_HOME_ROOM_ID_LIST = [
  '24113855649@chatroom',   // Wechaty Developers' Room
  '7582163093@chatroom',    // Wechaty Developers' Room 1
  '5729603967@chatroom',    // Wechaty Developers' Room 2
  '4335801863@chatroom',    // Wechaty Developers' Room 3
  '22396239792@chatroom',   // Wechaty Developers' Room 4
  '19112581505@chatroom',   // Wechaty Developers' Room 5
]

/**
 * ChatOps Room ID
 */
export const CHATOPS_ROOM_ID   = '5611663299@chatroom'   // 'ChatOps - Mike BO'
export const HEARTBEAT_ROOM_ID = '17376996519@chatroom'  // 'ChatOps - Heartbeat'
