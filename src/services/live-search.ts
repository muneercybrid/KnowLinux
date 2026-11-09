export interface LiveSearchResult {
  name: string
  version: string
  repo: string
  distro: string
}

export async function liveSearchRepology(query: string): Promise<LiveSearchResult[]> {
  try {
    const res = await fetch(`https://repology.org/api/v1/projects/?search=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'KnowLinux/1.0 (https://knowlinux.tech)' }
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []

    const results: LiveSearchResult[] = []
    for (const project of data) {
      const packages = Object.values(project.repo || {}).flat() as any[]
      for (const pkg of packages.slice(0, 3)) {
        results.push({
          name: project.name || project.srcname,
          version: pkg.version || 'unknown',
          repo: pkg.repo,
          distro: pkg.repo.split('_')[0] || pkg.repo
        })
      }
      if (results.length > 50) break
    }
    return results
  } catch (error) {
    console.error('Live search failed:', error)
    return []
  }
}
