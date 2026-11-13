import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { PackageModal, PackageInfo } from '../components/PackageModal'
import { ArrowLeft, Search, Terminal, Loader2, Info, Layout, Wrench, Package, Library, AlertTriangle, Server } from 'lucide-react'

interface Device { id: number; name: string; osInfo: string; lastSeenAt: string }
interface Command { id: number; command: string; status: string; output: string | null; exitCode: number | null; createdAt: string; requiresSudo?: boolean; cwdBefore?: string | null; cwdAfter?: string | null }

const TABS = [
  { id: 'info', label: 'System Info', icon: Info },
  { id: 'commands', label: 'Command Center', icon: Terminal },
  { id: 'apps', label: 'Apps', icon: Layout },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'libraries', label: 'Libraries', icon: Library },
  { id: 'outdated', label: 'Outdated', icon: AlertTriangle },
] as const

type TabId = typeof TABS[number]['id']

export default function WorkstationDetail() {
  const { id } = useParams()
  const [device, setDevice] = useState<Device | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [allPackages, setAllPackages] = useState<PackageInfo[]>([])
  const [commands, setCommands] = useState<Command[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [newCommand, setNewCommand] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<PackageInfo | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [requiresSudo, setRequiresSudo] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingCommandId, setPendingCommandId] = useState<number | null>(null)
  const [sudoPassword, setSudoPassword] = useState('')

  const refreshCommands = () => {
    fetch(`/api/companion/devices/${id}/commands`)
      .then(r => r.json())
      .then(d => setCommands(Array.isArray(d) ? d : []))
      .catch(() => {})
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/companion/devices').then(r => r.json()),
      fetch(`/api/companion/devices/${id}/packages`).then(r => r.json()),
    ]).then(([devices, pkgs]) => {
      setDevice(Array.isArray(devices) ? devices.find((d: Device) => d.id === parseInt(id || '0')) : null)
      setAllPackages(Array.isArray(pkgs) ? pkgs : [])
      setLoading(false)
    }).catch(() => setLoading(false))
    refreshCommands()
    const interval = setInterval(refreshCommands, 1000)
    const statusInterval = setInterval(() => {
      fetch(`/api/companion/devices/${id}`)
        .then(r => r.json())
        .then(d => {
          if (d.lastSeenAt) {
            const age = Date.now() - new Date(d.lastSeenAt).getTime()
            setIsOnline(age < 10000)
          }
        })
        .catch(() => {})
    }, 2000)
    // Initial check
    fetch(`/api/companion/devices/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.lastSeenAt) {
          const age = Date.now() - new Date(d.lastSeenAt).getTime()
          setIsOnline(age < 10000)
        }
      })
      .catch(() => {})
    return () => { clearInterval(interval); clearInterval(statusInterval) }
  }, [id])

  const handleSendCommand = async () => {
    if (!newCommand.trim()) return
    setSending(true)
    const res = await fetch(`/api/companion/devices/${id}/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: newCommand, requiresSudo })
    })
    const data = await res.json()
    setNewCommand('')
    setSending(false)
    refreshCommands()
    if (requiresSudo && data.id) {
      setPendingCommandId(data.id)
      setShowPasswordModal(true)
    }
  }

  const handlePasswordSubmit = async () => {
    if (!pendingCommandId || !sudoPassword) return
    await fetch(`/api/companion/commands/${pendingCommandId}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: sudoPassword })
    })
    setSudoPassword('')
    setPendingCommandId(null)
    setShowPasswordModal(false)
    refreshCommands()
  }

  let os: any = {}
  try { os = JSON.parse(device?.osInfo || '{}') } catch (e) {}

  const apps = allPackages.filter(p => p.type === 'app')
  const tools = allPackages.filter(p => p.type === 'tool')
  const packages = allPackages.filter(p => p.type === 'package')
  const libraries = allPackages.filter(p => p.type === 'library')
  const outdated = allPackages.filter(p => p.isOutdated)

  const filterList = (list: PackageInfo[]) => {
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
  }

  const currentList =
    activeTab === 'apps' ? filterList(apps) :
    activeTab === 'tools' ? filterList(tools) :
    activeTab === 'packages' ? filterList(packages) :
    activeTab === 'libraries' ? filterList(libraries) :
    activeTab === 'outdated' ? filterList(outdated) : []


  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commands])

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
        <Link to="/workstation" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workstations
        </Link>

        {device && (
          <div className="mb-6 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3">
              <Server className="w-6 h-6 text-brand" />
              <div>
                <h1 className="text-xl font-bold">{os.hostname || device.name}</h1>
                <p className="text-xs text-[var(--text-muted)]">{os.distro} · {os.arch} · Kernel {os.kernel}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-1 border-b border-[var(--border-color)]">
            {TABS.map(tab => {
              const Icon = tab.icon
              const count = tab.id === 'apps' ? apps.length : tab.id === 'tools' ? tools.length : tab.id === 'packages' ? packages.length : tab.id === 'libraries' ? libraries.length : tab.id === 'outdated' ? outdated.length : 0
              return (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch('') }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-[var(--text-muted)] hover:text-brand'}`}>
                  <Icon className="w-4 h-4" />{tab.label}
                  {count > 0 && <span className="text-xs bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded-full">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {activeTab === 'info' && device && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Hostname', value: os.hostname },
              { label: 'Distribution', value: os.distro },
              { label: 'Kernel', value: os.kernel },
              { label: 'Architecture', value: os.arch },
              { label: 'Last Scanned', value: new Date(device.lastSeenAt).toLocaleString() },
              { label: 'Total Packages', value: allPackages.length.toString() },
            ].map(item => (
              <div key={item.label} className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)]">
                <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">{item.label}</div>
                <div className="font-mono text-sm">{item.value || '—'}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'commands' && (
          <div className="flex flex-col" style={{ height: '75vh' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-sm font-semibold">{isOnline ? 'Online' : 'Offline'}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  · last seen {isOnline ? 'just now' : 'over 10s ago'}
                </span>
              </div>
              <button
                onClick={() => setRequiresSudo(!requiresSudo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border ${requiresSudo ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-muted)]'}`}
              >
                {requiresSudo ? 'sudo' : 'user'}
              </button>
            </div>
            <div
              ref={terminalRef}
              className="flex-1 overflow-y-auto bg-[#0d1117] border border-[#30363d] rounded-lg p-4 font-mono text-sm cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              <div className="text-[var(--text-faint)] mb-3 pb-2 border-b border-[#21262d]">
                Connected to <span className="text-brand">{os.hostname || 'remote'}</span> ({os.distro || 'Linux'})
              </div>
              {commands.slice().reverse().map((cmd: Command) => (
                <div key={cmd.id} className="mb-1">
                  <div className="flex flex-wrap items-baseline">
                    <span className="text-emerald-500">{os.hostname || 'remote'}</span>
                    <span className="text-[#8b949e]">:</span>
                    <span className="text-blue-400">{cmd.cwdBefore || '~'}</span>
                    <span className="text-[#8b949e]">$ </span>
                    <span className="text-[var(--text-main)]">{cmd.command}</span>
                    {cmd.requiresSudo && <span className="text-amber-500 text-xs ml-2">[sudo]</span>}
                  </div>
                  {cmd.status === 'pending' && <div className="text-amber-500 text-xs pl-2">running...</div>}
                  {cmd.status === 'awaiting_password' && <div className="text-amber-500 text-xs pl-2">awaiting password</div>}
                  {cmd.status === 'completed' && cmd.output && (
                    <pre className={`whitespace-pre-wrap text-[#c9d1d9] pl-2 ${cmd.exitCode !== null && cmd.exitCode !== 0 ? 'text-red-400' : ''}`}>{cmd.output}</pre>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap items-baseline mt-2">
                <span className="text-emerald-500">{os.hostname || 'remote'}</span>
                <span className="text-[#8b949e]">:</span>
                <span className="text-blue-400">{commands[0]?.cwdAfter || '~'}</span>
                <span className="text-[#8b949e]">$ </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={newCommand}
                  onChange={e => setNewCommand(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendCommand()}
                  className="flex-1 bg-transparent border-none outline-none text-[var(--text-main)] font-mono text-sm caret-emerald-500"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
                {sending && <Loader2 className="w-4 h-4 animate-spin text-brand ml-2" />}
              </div>
            </div>
            <p className="text-xs text-[var(--text-faint)] mt-2">
              {commands.length} command{commands.length !== 1 ? 's' : ''} · click terminal to focus
            </p>
          </div>
        )}

        {(activeTab === 'apps' || activeTab === 'tools' || activeTab === 'packages' || activeTab === 'libraries' || activeTab === 'outdated') && (
          <div>
            <div className="mb-4 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            {loading ? (
              <p className="text-center py-8 text-[var(--text-muted)]">Loading...</p>
            ) : currentList.length === 0 ? (
              <p className="text-center py-12 text-[var(--text-muted)]">No {activeTab} found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentList.map(pkg => (
                  <button key={pkg.id} onClick={() => setSelectedPkg(pkg)}
                    className="text-left p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono font-bold text-brand text-sm truncate">{pkg.name}</span>
                      <span className="text-xs text-[var(--text-faint)] ml-2 shrink-0">{pkg.version}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">{pkg.description || 'No description'}</p>
                    {pkg.isOutdated && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">Update → {pkg.latestVersion}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
      <PackageModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2">Sudo Password Required</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Your machine is running as a normal user. Enter the sudo password to run this command.</p>
            <input type="password" value={sudoPassword} onChange={e => setSudoPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Sudo password"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowPasswordModal(false); setSudoPassword(''); setPendingCommandId(null) }}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] font-semibold">Cancel</button>
              <button onClick={handlePasswordSubmit} disabled={!sudoPassword}
                className="flex-1 bg-brand hover:bg-brand-hover text-dark-bg px-4 py-2 rounded-lg font-semibold disabled:opacity-50">Submit</button>
            </div>
            <p className="text-xs text-[var(--text-faint)] mt-3">Password is used once and wiped immediately after execution.</p>
          </div>
        </div>
      )}
    </div>
  )
}
