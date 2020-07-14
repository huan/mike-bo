/**
 * To make ts-node happy without --files args
 * Note: this <reference ... /> must be put before all code, or it will be ignored.
 */
/// <reference path="./typings.d.ts" />

/**
 * VERSION
 */
import readPkgUp  from 'read-pkg-up'
import dotenv     from 'dotenv'

dotenv.config()

const pkg = readPkgUp.sync({ cwd: __dirname })!.packageJson
const VERSION = pkg.version

/**
 * Env Vars
 */
const PORT = process.env.PORT || 8788

export {
  PORT,
  VERSION,
}
