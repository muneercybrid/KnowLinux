import { useEffect } from 'react'
import { X, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface PackageInfo {
  id: number
  name: string
  version: string | null
  description: string | null
  type: string
  executablePath: string | null
  latestVersion: string | null
  isOutdated: boolean
}

export function PackageModal({ pkg, onClose }: { pkg: PackageInfo | null; onClose: () => void }) {
  useEffect(() => {
    if (!pkg) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pkg, onClose])
  if (!pkg) return null
  const installCmd = `sudo apt install ${pkg.name}`
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div onClick={e => e.stopPropagation()} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold font-mono text-brand">{pkg.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-elevated)] capitalize">{pkg.type}</span>
            </div>
            {pkg.version && <p className="text-sm text-[var(--text-muted)]">v{pkg.version}</p>}
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-brand"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {pkg.isOutdated && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <RefreshCw className="w-4 h-4" /><span className="font-semibold text-sm">Update Available</span>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{pkg.version} → <strong className="text-amber-400">{pkg.latestVersion}</strong></p>
            </div>
          )}
          {pkg.description && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold mb-1 text-[var(--text-muted)]">Description</h3>
              <p className="text-sm">{pkg.description}</p>
            </div>
          )}
          {pkg.executablePath && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold mb-1 text-[var(--text-muted)]">Executable</h3>
              <code className="text-xs bg-[#0d1117] p-2 rounded block text-emerald-400 font-mono overflow-x-auto">{pkg.executablePath}</code>
            </div>
          )}
          <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
            <button onClick={() => navigator.clipboard.writeText(installCmd)} className="w-full flex items-center justify-center gap-2 bg-[var(--bg-elevated)] hover:border-brand border border-[var(--border-color)] px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <Copy className="w-4 h-4" /> Copy install command
            </button>
            <Link to={`/tools/live/${pkg.name}`} className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-dark-bg px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <ExternalLink className="w-4 h-4" /> Use Tool →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
