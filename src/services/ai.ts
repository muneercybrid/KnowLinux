export async function generateAIResponse(prompt: string, systemContext: string = ''): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY is not configured in the environment.')
  }

  const payload = {
    model: "meta/llama3-70b-instruct", // Or another supported NVIDIA NIM model
    messages: [
      { role: "system", content: systemContext || "You are an expert Linux systems engineer. Provide accurate, concise, and safe technical information." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2, // Low temperature for more factual responses
    max_tokens: 1024,
    top_p: 0.7
  }

  try {
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
      throw new Error(`NVIDIA API Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error: any) {
    console.error('AI Generation Error:', error.message)
    throw error
  }
}
