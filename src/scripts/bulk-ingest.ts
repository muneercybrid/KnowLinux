import { getDb } from '../prisma/db.js'
import { fetchAllPackages } from '../services/connectors.js'

const db = getDb()

async function main() {
  console.log('Starting bulk ingestion...')
  const tools = await db.orm.public.Tool.all()
  let totalPackages = 0

  for (const tool of tools) {
    console.log(`Ingesting ${tool.name}...`)
    const packages = await fetchAllPackages(tool.name)
    
    for (const pkg of packages) {
      await db.orm.public.Package.upsert({
        conflictOn: { toolId: tool.id, distro: pkg.distro, packageName: pkg.packageName },
        update: { version: pkg.version, repo: pkg.repo, source: pkg.source },
        create: { toolId: tool.id, distro: pkg.distro, repo: pkg.repo, packageName: pkg.packageName, version: pkg.version, source: pkg.source }
      })
      totalPackages++
    }
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`Done. Ingested ${totalPackages} packages across ${tools.length} tools.`)
  await db.close()
}

main().catch(console.error)
