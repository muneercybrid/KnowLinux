const apiKey = process.env.NVIDIA_API_KEY
if (!apiKey) {
  console.error('NVIDIA_API_KEY is missing in .env')
  process.exit(1)
}

async function fetchAllModels() {
  console.log('Fetching available models from NVIDIA NIM...')
  const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch models: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  return data.data.map((m: any) => m.id).sort()
}

async function testModel(model: string) {
  const start = Date.now()
  try {
    const payload: any = {
      model,
      messages: [{ role: "user", content: "In one sentence, what is Linux?" }],
      temperature: 0.1,
      max_tokens: 50,
    }
    // Add reasoning template kwargs for DeepSeek/Nemotron models
    if (model.includes('deepseek') || model.includes('nemotron')) {
      payload.chat_template_kwargs = { enable_thinking: false } // Disable thinking for speed test
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!res.ok) {
      return { model, status: 'FAILED', code: res.status, ms: Date.now() - start }
    }

    const data = await res.json()
    const output = data.choices[0].message.content.trim().replace(/\n/g, ' ')
    return { model, status: 'OK', ms: Date.now() - start, output }
  } catch (err: any) {
    return { model, status: 'ERROR', ms: Date.now() - start, output: err.message }
  }
}

async function main() {
  try {
    const allModels = await fetchAllModels()
    console.log(`Found ${allModels.length} models. Testing each...\n`)

    const workingModels: any[] = []

    // Test in parallel but with a concurrency limit to avoid hitting rate limits
    const batchSize = 5
    for (let i = 0; i < allModels.length; i += batchSize) {
      const batch = allModels.slice(i, i + batchSize)
      const results = await Promise.all(batch.map(testModel))
      
      for (const result of results) {
        if (result.status === 'OK') {
          console.log(`✅ ${result.model} (${result.ms}ms)`)
          workingModels.push(result)
        } else {
          console.log(`❌ ${result.model} - ${result.status}`)
        }
      }
    }

    console.log('\n--- WORKING MODELS (Sorted by speed) ---')
    const sorted = workingModels.sort((a, b) => a.ms - b.ms)
    for (const m of sorted) {
      console.log(`${m.ms}ms | ${m.model}`)
    }

    console.log('\n--- SUGGESTED MODEL_CHAIN for ai.ts ---')
    console.log(JSON.stringify(sorted.slice(0, 5).map(m => m.model), null, 2))

  } catch (error) {
    console.error('Scan failed:', error)
  }
}

main()
