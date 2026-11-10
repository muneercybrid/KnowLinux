export const MODEL_CHAIN = [
  "poolside/laguna-xs-2.1",
  "nvidia/nemotron-3.5-bolt-e4b",
  "nvidia/nemotron-3-ultra-550b-a55b",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
]

interface ChatPayload {
  model: string
  messages: { role: string; content: string }[]
  temperature: number
  max_tokens: number
  top_p: number
  chat_template_kwargs?: { enable_thinking: boolean }
}

export async function generateAIResponse(
  prompt: string,
  systemContext: string = ''
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) throw new Error('NVIDIA_API_KEY is not configured.')

  let lastError: any = null

  for (const model of MODEL_CHAIN) {
    try {
      console.log(`[AI] Attempting model: ${model}`)

      const payload: ChatPayload = {
        model,
        messages: [
          { role: 'system', content: systemContext || 'You are an expert Linux systems engineer.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2048,
        top_p: 0.7
      }

      if (model.includes('nemotron')) {
        payload.chat_template_kwargs = { enable_thinking: true }
      }

      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`[AI] Model ${model} failed: ${response.status} - ${errorText}`)
        lastError = new Error(`Model ${model} failed: ${response.status}`)
        continue
      }

      const data: any = await response.json()
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from NVIDIA API')
      }

      const content: string = data.choices[0].message.content
      if (!content) throw new Error('Empty content returned from model')

      console.log(`[AI] Success with model: ${model}`)
      return content
    } catch (error: any) {
      console.warn(`[AI] Model ${model} threw error: ${error.message}`)
      lastError = error
    }
  }

  throw new Error(`All AI models failed. Last error: ${lastError?.message || 'Unknown'}`)
}
