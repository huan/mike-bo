import { log } from 'wechaty'

/**
 * How to Use the last Command on Linux
 *   https://www.howtogeek.com/416023/how-to-use-the-last-command-on-linux/
 */
interface WTmpEntry {
  name    : string,
  login   : number,
  logout? : number,
}

export class WTmp {

  private static singleton: WTmp

  private bornTime: number
  private wtmpList: WTmpEntry[] = []

  public static instance () {
    if (!this.singleton) {
      this.singleton = new this()
    }

    return this.singleton
  }

  private constructor () {
    this.bornTime = Date.now()
  }

  public login (name: string): void {
    const wtmp: WTmpEntry = {
      login: Date.now(),
      name,
    }

    this.wtmpList.push(wtmp)
  }

  public logout (name: string): void {
    if (!this.wtmpList.length) {
      return
    }

    const lastEntry = this.last()
    if (lastEntry.name !== name) {
      log.silly('WTmp', 'logout("%s") name not match the last one: "%s"', lastEntry.name)
    }

    lastEntry.logout = Date.now()
  }

  public list (): WTmpEntry[] {
    return this.wtmpList
  }

  public first (): WTmpEntry {
    if (this.wtmpList.length > 0) {
      return this.wtmpList[0]
    }
    throw new Error('no entry found')
  }

  public last (): WTmpEntry {
    if (this.wtmpList.length > 0) {
      return this.wtmpList[-1]
    }
    throw new Error('no entry found')
  }

}
