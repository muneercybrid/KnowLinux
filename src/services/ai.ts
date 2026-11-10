export const MODEL_CHAIN = [
  "nvidia/nemotron-3.5-lightning-30b-a3b",     // Fast, general purpose
  "nvidia/nemotron-3.5-bolt-e4b",              // Fast, general purpose
  "poolside/laguna-xs-2.1",                    // Good for coding/commands
  "nvidia/nemotron-3-ultra-550b-a55b",         // Heavy reasoning fallback
]

export async function generateAIResponse(prompt: string, systemContext: string = ''): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) throw new Error('NVIDIA_API_KEY is not configured.')

  let lastError: any = null

  for (const model of MODEL_CHAIN) {
    try {
      console.log(`[AI] Attempting model: ${model}`)
      
      const payload: any = {
        model,
        messages: [
          { role: "system", content: systemContext || "You are an expert Linux systems engineer." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1024,
        top_p: 0.7,
      }

      // Add reasoning template kwargs only for Nemotron reasoning models
      if (model.includes('nemotron')) {
        payload.chat_template_kwargs = { enable_thinking: true }
      }

      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`[AI] Model ${model} failed: ${response.status} - ${errorText}`)
        lastError = new Error(`Model ${model} failed: ${response.status}`)
        continue 
      }

      const data = await response.json()
      console.log(`[AI] Success with model: ${model}`)
      return data.choices[0].message.content
      
    } catch (error: any) {
      console.warn(`[AI] Model ${model} threw error:`, error.message)
      lastError = error
    }
  }

  throw new Error(`All AI models failed. Last error: ${lastError?.message || 'Unknown'}`)
}
