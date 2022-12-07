import { ChatGPTAPI } from 'chatgpt'

const sessionTokenList = Object.keys(process.env)
  .filter(key => /^CHATGPT_SESSION_TOKEN_/.test(key))
  .map(key => process.env[key])
  .filter(token => !!token) as string[]

let sessionTokenIndex = 0

export async function ChatGPTAPIBuilder () {

  if (sessionTokenList.length <= 0) {
    throw new Error('CHATGPT_SESSION_TOKEN_XXX is required')
  }

  // sessionToken is required; see below for details
  const apiPool = sessionTokenList.map(sessionToken => new ChatGPTAPI({
    // markdown: false,
    sessionToken,
  }))
  console.info('ChatGPTAPIBuilder() apiPool.length:', apiPool.length)

  // ensure the API is properly authenticated
  await Promise.all(apiPool.map(api => api.ensureAuth()))

  return {
    ask: async (question: string) => {
      const currentIndex = sessionTokenIndex

      sessionTokenIndex++
      if (sessionTokenIndex >= apiPool.length) {
        sessionTokenIndex = 0
      }

      const api = apiPool[currentIndex]
      const response = await Promise.any([
        api!.sendMessage(question),
        new Promise<string>(resolve => setTimeout(() => resolve(`API timeout at token[${currentIndex}]`), 1000 * 60 * 3)),
      ])
      console.info(`ChatGPTAPIBuilder() index[${sessionTokenIndex}] response:`, response)
      return response + `(token[${currentIndex}])])`
    },
  }
}
