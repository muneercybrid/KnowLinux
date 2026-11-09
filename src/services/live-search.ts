export interface LiveSearchResult {
  name: string
  version: string
  repo: string
  distro: string
}

export async function liveSearchRepology(query: string): Promise<LiveSearchResult[]> {
  try {
    // Query Repology's project search API
    const res = await fetch(`https://repology.org/api/v1/projects/?search=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'KnowLinux/1.0 (https://knowlinux.tech)' }
    })

    if (!res.ok) {
      console.warn(`Repology API error: ${res.status}`)
      return []
    }

    const data = await res.json()
    
    // Repology returns an array of projects
    if (!Array.isArray(data)) return []

    const results: LiveSearchResult[] = []
    
    // Iterate through the matching projects
    for (const project of data) {
      // Repology groups packages by repository inside the `repo` object
      const repos = project.repo || {}
      
      // Iterate through each repository (e.g., "debian_12", "arch", "fedora_39")
      for (const [repoName, packages] of Object.entries(repos)) {
        if (!Array.isArray(packages)) continue
        
        // Take up to 3 packages per repo to avoid overwhelming the UI
        for (const pkg of packages.slice(0, 3)) {
          results.push({
            name: project.name || project.srcname || query,
            version: (pkg as any).version || 'unknown',
            repo: (pkg as any).repo || repoName,
            distro: repoName.split('_')[0] || repoName
          })
        }
      }
      
      // Hard limit to 50 total results to keep the UI fast
      if (results.length > 50) break
    }

    return results
  } catch (error) {
    console.error('Live search failed:', error)
    return []
  }
}
