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
    // Repology uses the project name (e.g., 'nmap'), not the display name
    const projectName = toolName.toLowerCase().replace(/\s+/g, '-')
    const url = `https://repology.org/api/v1/project/${projectName}`
    console.log(`Fetching Repology: ${url}`)

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'KnowLinux/1.0 (https://knowlinux.tech)'
      }
    })

    if (!res.ok) {
      console.warn(`Repology API error for ${projectName}: ${res.status}`)
      return []
    }

    const data = await res.json()
    console.log(`Repology returned ${Array.isArray(data) ? data.length : 'non-array'} packages`)

    if (!Array.isArray(data)) return []

    return data.map((pkg: any) => ({
      distro: pkg.repo.split('_')[0] || pkg.repo,
      repo: pkg.repo,
      packageName: pkg.srcname || pkg.binname || projectName,
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
    const packageName = toolName.toLowerCase().replace(/\s+/g, '-')
    const url = `https://sources.debian.org/api/src/${packageName}/`
    console.log(`Fetching Debian: ${url}`)

    const res = await fetch(url)
    
    if (!res.ok) {
      if (res.status !== 404) {
        console.warn(`Debian API error for ${packageName}: ${res.status}`)
      }
      return []
    }

    const data = await res.json()
    console.log(`Debian returned ${data.versions?.length || 0} versions`)

    if (!data.versions || !Array.isArray(data.versions)) return []

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
  
  const repologyData = await fetchRepology(toolName)
  results.push(...repologyData)
  
  await sleep(1000) // Rate limit protection
  
  const hasDebian = repologyData.some(p => p.distro === 'debian')
  if (!hasDebian) {
    const debianData = await fetchDebian(toolName)
    results.push(...debianData)
  }

  return results
}
