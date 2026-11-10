import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { ArrowLeft, Package, Search, Cpu, Terminal, Send, Loader2 } from 'lucide-react'

interface Package { id: number; name: string; version: string | null; description: string | null }
interface Command { id: number; command: string; status: string; output: string | null; exitCode: number | null; createdAt: string }

export default function WorkstationDetail() {
  const { id } = useParams()
  const [device, setDevice] = useState<any>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [commands, setCommands] = useState<Command[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [newCommand, setNewCommand] = useState('')
  const [sending, setSending] = useState(false)

  const refreshCommands = () => {
    fetch(`/api/companion/devices/${id}/commands`)
      .then(r => r.json())
      .then(d => setCommands(Array.isArray(d) ? d : []))
  }
  useEffect(() => {
    fetch('/api/companion/devices')
      .then(r => r.json())
      .then((devices: any[]) => setDevice(devices.find(d => d.id === parseInt(id || '0'))))
    fetch(`/api/companion/devices/${id}/packages`)
      .then(r => r.json())
      .then(d => { setPackages(Array.isArray(d) ? d : []); setLoading(false) })
    refreshCommands()
    const interval = setInterval(refreshCommands, 5000)
    return () => clearInterval(interval)
  }, [id])

  const handleSendCommand = async () => {
    if (!newCommand.trim()) return
    setSending(true)
    await fetch(`/api/companion/devices/${id}/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: newCommand })
    })
    setNewCommand('')
    setSending(false)
    refreshCommands()
  }

  const filteredPackages = packages.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  )

  let os: any = {}
  try { os = JSON.parse(device?.osInfo || '{}') } catch (e) {}
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-12">
        <Link to="/workstation" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workstations
        </Link>
        {device && (
          <div className="mb-8 p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="w-6 h-6 text-brand" />
              <h1 className="text-2xl font-bold">{os.hostname || device.name}</h1>
            </div>
            <p className="text-sm text-[var(--text-muted)]">{os.distro} · {os.arch} · Kernel {os.kernel}</p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-brand" />
              <h2 className="text-xl font-bold">Remote Commands</h2>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <div className="flex gap-2 mb-4">
                <input type="text" value={newCommand} onChange={e => setNewCommand(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendCommand()} placeholder="e.g., uname -a" className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                <button onClick={handleSendCommand} disabled={sending || !newCommand.trim()} className="bg-brand hover:bg-brand-hover text-dark-bg px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center gap-2">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-[var(--text-faint)] mb-4">
                Agent will ask for confirmation. Start with: <code className="text-brand">knowlinux-agent daemon</code>
              </p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {commands.length === 0 ? (
                  <p className="text-center py-4 text-sm text-[var(--text-muted)]">No commands yet.</p>
                ) : commands.map(cmd => (
                  <div key={cmd.id} className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-sm">
                    <div className="flex justify-between mb-2">
                      <code className="text-brand font-mono">$ {cmd.command}</code>
                      <span className={`text-xs px-2 py-0.5 rounded ${cmd.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{cmd.status}</span>
                    </div>
                    {cmd.output && <pre className="text-xs bg-[#0d1117] p-2 rounded overflow-x-auto max-h-40 text-emerald-400">{cmd.output}</pre>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-brand" />
              <h2 className="text-xl font-bold">Installed Packages</h2>
              <span className="text-xs bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full text-[var(--text-muted)]">{packages.length}</span>
            </div>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packages..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            {loading ? (
              <p className="text-center py-8 text-[var(--text-muted)]">Loading...</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredPackages.map(pkg => (
                  <div key={pkg.id} className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)]">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-sm font-bold text-brand truncate">{pkg.name}</span>
                      <span className="text-xs text-[var(--text-faint)] ml-2 shrink-0">{pkg.version}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">{pkg.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
