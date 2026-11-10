import { getDb } from '../prisma/db.js'
import { generateAIResponse } from '../services/ai.js'

const db = getDb()

async function main() {
  console.log('Starting AI enrichment...')
  const tools = await db.orm.public.Tool.all()
  
  for (const tool of tools) {
    if (tool.aiDescription && tool.aiDescription.length > 50) {
      console.log(`Skipping ${tool.name} (already enriched)`)
      continue
    }

    console.log(`Generating AI overview for ${tool.name}...`)
    try {
      const prompt = `Write a comprehensive overview for the Linux tool "${tool.name}". 
      Include what it does, its primary use cases, and 3 bullet points of Pros, and 3 bullet points of Requirements. 
      Keep it under 200 words.`

      const aiDescription = await generateAIResponse(prompt)
      
      await db.orm.public.Tool.where({ slug: tool.slug }).update({ aiDescription })
      console.log(`✅ Enriched ${tool.name}`)
      
      // Sleep to respect API rate limits
      await new Promise(r => setTimeout(r, 2000))
    } catch (error) {
      console.error(`❌ Failed to enrich ${tool.name}`, error)
    }
  }

  console.log('Enrichment complete.')
  await db.close()
}

main().catch(console.error)
