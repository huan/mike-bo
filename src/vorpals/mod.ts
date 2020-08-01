import * as dm    from './direct-message'
import * as mike  from './chatops-mike'

const vorpalPluginList = [
  ...Object.values(dm),
  ...Object.values(mike),
]

export { vorpalPluginList }
