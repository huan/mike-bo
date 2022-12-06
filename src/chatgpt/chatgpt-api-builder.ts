import { ChatGPTAPI } from 'chatgpt'

export async function ChatGPTAPIBuilder () {

  const sessionToken = process.env['CHATGPT_SESSION_TOKEN']
  if (!sessionToken) {
    throw new Error('CHATGPT_SESSION_TOKEN is required')
  }

  // sessionToken is required; see below for details
  const api = new ChatGPTAPI({
    // markdown: false,
    sessionToken,
  })

  // ensure the API is properly authenticated
  await api.ensureAuth()

  return api
}
