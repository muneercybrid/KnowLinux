const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface NormalizedPackage {
  distro: string
  repo: string
  packageName: string
  version: string
  source: string
}

export async function fetchRepology(toolName: string): Promise<NormalizedPackage[]> {
  try {
    const projectName = toolName.toLowerCase().replace(/\s+/g, '-')
    const res = await fetch(`https://repology.org/api/v1/project/${projectName}`, {
      headers: { 'User-Agent': 'KnowLinux/1.0 (https://knowlinux.tech)' }
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map((pkg: any) => ({
      distro: pkg.repo.split('_')[0] || pkg.repo,
      repo: pkg.repo,
      packageName: pkg.srcname || pkg.binname || projectName,
      version: pkg.version || 'unknown',
      source: 'repology'
    }))
  } catch (e) { return [] }
}

export async function fetchArch(toolName: string): Promise<NormalizedPackage[]> {
  try {
    const packageName = toolName.toLowerCase().replace(/\s+/g, '-')
    const res = await fetch(`https://archlinux.org/packages/search/json/?name=${packageName}`)
    if (!res.ok) return []
    const data = await res.json()
    if (!data.results) return []
    return data.results.map((pkg: any) => ({
      distro: 'arch',
      repo: pkg.repo,
      packageName: pkg.pkgname,
      version: pkg.pkgver + '-' + pkg.pkgrel,
      source: 'arch'
    }))
  } catch (e) { return [] }
}

export async function fetchDebian(toolName: string): Promise<NormalizedPackage[]> {
  try {
    const packageName = toolName.toLowerCase().replace(/\s+/g, '-')
    const res = await fetch(`https://sources.debian.org/api/src/${packageName}/`)
    if (!res.ok) return []
    const data = await res.json()
    if (!data.versions || !Array.isArray(data.versions)) return []
    const latest = data.versions[0]
    if (!latest) return []
    return [{ distro: 'debian', repo: 'sources', packageName: data.package, version: latest.version, source: 'debian' }]
  } catch (e) { return [] }
}

export async function fetchAllPackages(toolName: string): Promise<NormalizedPackage[]> {
  const results: NormalizedPackage[] = []
  const repologyData = await fetchRepology(toolName)
  results.push(...repologyData)
  await sleep(1000)
  if (!repologyData.some(p => p.distro === 'arch')) {
    const archData = await fetchArch(toolName)
    results.push(...archData)
  }
  if (!repologyData.some(p => p.distro === 'debian')) {
    const debianData = await fetchDebian(toolName)
    results.push(...debianData)
  }
  return results
}
