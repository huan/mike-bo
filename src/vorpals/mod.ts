import * as dm    from './direct-message.js'
import * as mike  from './chatops-mike.js'

const vorpalPluginList = [
  ...Object.values(dm),
  ...Object.values(mike),
]

export { vorpalPluginList }
