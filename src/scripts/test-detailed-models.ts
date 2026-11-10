import { config } from 'dotenv'
config()

const apiKey = process.env.NVIDIA_API_KEY
if (!apiKey) {
  console.error('NVIDIA_API_KEY is missing in .env')
  process.exit(1)
}

// Only testing models confirmed working from the earlier scan
const MODELS_TO_TEST = [
  "nvidia/nemotron-3-ultra-550b-a55b",           // Heavy reasoning (confirmed working)
  "nvidia/nemotron-3.5-bolt-e4b",                // Medium reasoning (confirmed working)
  "nvidia/nemotron-3.5-lightning-30b-a3b",       // Fast (confirmed working)
  "nvidia/nemotron-3.5-super-vl-120b-a12b",      // Super (confirmed working)
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", // Reasoning variant
  "poolside/laguna-xs-2.1",                      // Coding/command focused
]

const systemPrompt = `You are KnowLinux Fix, an expert Linux systems engineer.
Analyze the user's error message and provide a comprehensive, detailed solution.
Separate read-only diagnostics from system modifications.
Respond ONLY with valid JSON matching this structure exactly. Do not use markdown backticks.
{
  "diagnostics": ["read_only_cmd_1", "read_only_cmd_2"],
  "fixes": ["fix_cmd_1", "fix_cmd_2"],
  "explanation": "A detailed explanation of the cause and the fix."
}`

const userPrompt = `I am getting this error on my Linux system:
"E: Could not get lock /var/lib/dpkg/lock-frontend. It is held by process 1234 (apt-get)"
How do I fix it? Please provide a detailed analysis.`

interface TestResult {
  model: string
  latency: number
  validJson: boolean
  outputLength: number
  output: string
  error?: string
}

async function testModel(model: string): Promise<TestResult> {
  const start = Date.now()
  
  const payload: any = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: 2048,
    top_p: 0.7,
  }

  if (model.includes('nemotron') || model.includes('deepseek')) {
    payload.chat_template_kwargs = { enable_thinking: true }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000) // 2 min timeout

    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    clearTimeout(timeout)

    const elapsed = (Date.now() - start) / 1000

    if (!res.ok) {
      return { model, latency: elapsed, validJson: false, outputLength: 0, output: '', error: `${res.status} ${await res.text()}` }
    }

    const data = await res.json()
    const content = data.choices[0].message.content
    
    let validJson = false
    try {
      const match = content.match(/\{[\s\S]*\}/)
      JSON.parse(match ? match[0] : content)
      validJson = true
    } catch (e) {}

    return {
      model,
      latency: elapsed,
      validJson,
      outputLength: content.length,
      output: content.slice(0, 500) + (content.length > 500 ? '\n...(truncated)' : '')
    }
  } catch (err: any) {
    return { model, latency: (Date.now() - start) / 1000, validJson: false, outputLength: 0, output: '', error: err.message }
  }
}

async function main() {
  console.log('🧪 Testing Detailed AI Models for Linux Troubleshooting\n')
  const results: TestResult[] = []

  for (const model of MODELS_TO_TEST) {
    console.log(`⏳ Testing: ${model}`)
    const r = await testModel(model)
    results.push(r)
    
    if (r.error) {
      console.log(`   ❌ ERROR (${r.latency.toFixed(2)}s): ${r.error.slice(0, 200)}`)
    } else {
      console.log(`   ✅ ${r.latency.toFixed(2)}s | JSON: ${r.validJson ? '✅' : '❌'} | Length: ${r.outputLength} chars`)
      console.log(`   📄 Preview: ${r.output.replace(/\n/g, ' ').slice(0, 200)}...\n`)
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('📊 FINAL RANKING (by valid JSON + quality)')
  console.log('='.repeat(70))

  const sorted = results
    .filter(r => !r.error && r.validJson)
    .sort((a, b) => {
      // Prefer longer outputs (more detailed) but factor in latency
      const scoreA = a.outputLength / (a.latency + 1)
      const scoreB = b.outputLength / (b.latency + 1)
      return scoreB - scoreA
    })

  for (const r of sorted) {
    console.log(`✅ ${r.latency.toFixed(1)}s | ${r.outputLength} chars | ${r.model}`)
  }
  
  console.log('\n--- Recommended MODEL_CHAIN (detailed reasoning first) ---')
  console.log(JSON.stringify(sorted.slice(0, 4).map(r => r.model), null, 2))
}

main()
