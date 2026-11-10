import { MODEL_CHAIN } from '../services/ai.js'

const apiKey = process.env.NVIDIA_API_KEY
if (!apiKey) {
  console.error('NVIDIA_API_KEY is missing in .env')
  process.exit(1)
}

async function testModel(model: string) {
  const start = Date.now()
  try {
    const payload: any = {
      model,
      messages: [{ role: "user", content: "In one sentence, what does the Linux command 'nmap' do?" }],
      temperature: 0.1,
      max_tokens: 100,
    }
    if (model.includes('nemotron')) {
      payload.chat_template_kwargs = { enable_thinking: true }
    }

    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      return { model, status: 'FAILED', code: res.status, ms: Date.now() - start, output: await res.text() }
    }

    const data = await res.json()
    const output = data.choices[0].message.content.trim()
    return { model, status: 'OK', ms: Date.now() - start, output }
  } catch (err: any) {
    return { model, status: 'ERROR', ms: Date.now() - start, output: err.message }
  }
}

async function main() {
  console.log('Testing NVIDIA NIM models...\n')
  for (const model of MODEL_CHAIN) {
    const result = await testModel(model)
    console.log(`--- ${result.model} ---`)
    console.log(`Status: ${result.status} | Time: ${result.ms}ms`)
    console.log(`Output: ${result.output}\n`)
  }
}

main()
