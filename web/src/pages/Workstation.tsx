import { useEffect, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Link } from 'react-router-dom'
import { Monitor, Cpu, Terminal, ArrowRight } from 'lucide-react'

interface Device { id: number; name: string; osInfo: string; lastSeenAt: string }

export default function Workstation() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/companion/devices')
      .then(r => r.json())
      .then(d => { setDevices(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Monitor className="w-8 h-8 text-brand" /> My Workstations
            </h1>
            <p className="text-[var(--text-muted)] mt-2">Manage your Linux machines.</p>
          </div>
          <Link to="/activate" className="bg-brand hover:bg-brand-hover text-dark-bg px-4 py-2 rounded-lg font-semibold text-sm">
            Connect New
          </Link>
        </div>
        {loading ? (
          <p className="text-center py-12 text-[var(--text-muted)]">Loading...</p>
        ) : devices.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)]">
            <Terminal className="w-16 h-16 text-[var(--text-faint)] mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No machines connected</h2>
            <code className="bg-[#0d1117] border border-[#30363d] text-emerald-400 px-4 py-2 rounded text-sm">knowlinux-agent connect</code>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map(d => {
              let os: any = {}
              try { os = JSON.parse(d.osInfo || '{}') } catch (e) {}
              return (
                <Link key={d.id} to={`/workstation/${d.id}`} className="block p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors group">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu className="w-5 h-5 text-brand" />
                        <span className="text-lg font-bold">{os.hostname || d.name}</span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">{os.distro} · {os.arch}</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[var(--text-faint)] group-hover:text-brand" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
