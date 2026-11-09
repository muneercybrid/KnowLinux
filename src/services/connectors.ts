// Helper to pause execution (for rate limits)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface NormalizedPackage {
  distro: string
  repo: string
  packageName: string
  version: string
  source: string
}

// --- Repology Connector ---
export async function fetchRepology(toolName: string): Promise<NormalizedPackage[]> {
  try {
    const res = await fetch(`https://repology.org/api/v1/project/${toolName}`, {
      headers: {
        'User-Agent': 'KnowLinux/1.0 (https://knowlinux.tech)'
      }
    })

    if (!res.ok) {
      console.warn(`Repology API error for ${toolName}: ${res.status}`)
      return []
    }

    const data = await res.json()
    if (!Array.isArray(data)) return []

    // Map Repology data to our normalized format
    return data.map((pkg: any) => ({
      distro: pkg.repo.split('_')[0] || pkg.repo, // e.g., "debian_13" -> "debian"
      repo: pkg.repo,
      packageName: pkg.srcname || pkg.binname || toolName,
      version: pkg.version || 'unknown',
      source: 'repology'
    }))
  } catch (error) {
    console.error(`Failed to fetch Repology data for ${toolName}:`, error)
    return []
  }
}

// --- Debian Sources Connector ---
export async function fetchDebian(toolName: string): Promise<NormalizedPackage[]> {
  try {
    const res = await fetch(`https://sources.debian.org/api/src/${toolName}/`)
    
    if (!res.ok) {
      // 404 is normal if the tool isn't in Debian
      if (res.status !== 404) {
        console.warn(`Debian API error for ${toolName}: ${res.status}`)
      }
      return []
    }

    const data = await res.json()
    if (!data.versions || !Array.isArray(data.versions)) return []

    // Extract the latest version
    const latest = data.versions[0]
    if (!latest) return []

    return [{
      distro: 'debian',
      repo: 'sources',
      packageName: data.package,
      version: latest.version,
      source: 'debian'
    }]
  } catch (error) {
    console.error(`Failed to fetch Debian data for ${toolName}:`, error)
    return []
  }
}

// --- Orchestrator ---
export async function fetchAllPackages(toolName: string): Promise<NormalizedPackage[]> {
  const results: NormalizedPackage[] = []
  
  // Fetch from Repology
  const repologyData = await fetchRepology(toolName)
  results.push(...repologyData)
  
  // Rate limit protection (be polite to Repology)
  await sleep(1000)
  
  // Fetch from Debian (only if Repology didn't already find Debian packages)
  const hasDebian = repologyData.some(p => p.distro === 'debian')
  if (!hasDebian) {
    const debianData = await fetchDebian(toolName)
    results.push(...debianData)
  }

  return results
}
