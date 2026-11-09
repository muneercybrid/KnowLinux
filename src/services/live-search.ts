export interface LiveSearchResult {
  name: string
  version: string
  repo: string
  distro: string
}

// Debug function to return raw Repology data
export async function debugRepology(query: string) {
  const name = query.toLowerCase().trim().replace(/\s+/g, '-')
  const url = `https://repology.org/api/v1/project/${name}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'KnowLinux/1.0 (https://knowlinux.tech; contact@knowlinux.tech)',
        'Accept': 'application/json'
      }
    })
    const text = await res.text()
    return { url, status: res.status, statusText: res.statusText, bodyPreview: text.slice(0, 2000) }
  } catch (error: any) {
    return { url, error: error.message || 'unknown' }
  }
}

export async function liveSearchRepology(query: string): Promise<LiveSearchResult[]> {
  // Normalize: "nmap" -> "nmap", "John the Ripper" -> "john-the-ripper"
  const projectName = query.toLowerCase().trim().replace(/\s+/g, '-')
  
  // Try the correct Repology endpoint - exact project lookup
  const url = `https://repology.org/api/v1/project/${encodeURIComponent(projectName)}`
  
  try {
    console.log(`[LiveSearch] Fetching: ${url}`)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'KnowLinux/1.0 (https://knowlinux.tech; contact@knowlinux.tech)',
        'Accept': 'application/json'
      }
    })

    console.log(`[LiveSearch] Response: ${res.status} ${res.statusText}`)

    if (!res.ok) {
      console.warn(`[LiveSearch] Repology returned ${res.status}`)
      return []
    }

    const data = await res.json()
    console.log(`[LiveSearch] Data type: ${Array.isArray(data) ? 'array' : typeof data}, length: ${Array.isArray(data) ? data.length : 'n/a'}`)

    if (!Array.isArray(data)) {
      console.warn(`[LiveSearch] Expected array, got:`, Object.keys(data).slice(0, 10))
      return []
    }

    // Map Repology packages to our normalized format
    const results: LiveSearchResult[] = data.map((pkg: any) => ({
      name: pkg.project || pkg.srcname || projectName,
      version: pkg.version || 'unknown',
      repo: pkg.repo || 'unknown',
      distro: (pkg.repo || '').split('_')[0] || pkg.repo || 'unknown'
    }))

    console.log(`[LiveSearch] Returning ${results.length} results`)
    return results
  } catch (error: any) {
    console.error('[LiveSearch] Error:', error.message || error)
    return []
  }
}
