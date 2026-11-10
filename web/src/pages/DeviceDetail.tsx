import { useEffect, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Package, Search, Cpu } from 'lucide-react'

interface Package {
  id: number
  name: string
  version: string | null
  description: string | null
}

interface Device {
  id: number
  name: string
  osInfo: string
  lastSeenAt: string
}

export default function DeviceDetail() {
  const { id } = useParams()
  const [device, setDevice] = useState<Device | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch device list to find this device
    fetch('/api/companion/devices')
      .then(res => res.json())
      .then((devices: Device[]) => {
        const found = devices.find(d => d.id === parseInt(id || '0'))
        setDevice(found || null)
      })

    fetch(`/api/companion/devices/${id}/packages`)
      .then(res => res.json())
      .then(data => {
        setPackages(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const filteredPackages = packages.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  )

  let osInfo: any = {}
  try { osInfo = JSON.parse(device?.osInfo || '{}') } catch (e) {}

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-12">
        <Link to="/account" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Account
        </Link>

        {device && (
          <div className="mb-8 p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="w-6 h-6 text-brand" />
              <h1 className="text-2xl font-bold">{osInfo.hostname || device.name}</h1>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {osInfo.distro} · {osInfo.arch} · Kernel {osInfo.kernel}
            </p>
            <p className="text-xs text-[var(--text-faint)] mt-2">
              Last scanned: {new Date(device.lastSeenAt).toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-brand" />
            <h2 className="text-xl font-bold">Installed Packages</h2>
            <span className="text-sm bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full text-[var(--text-muted)]">
              {packages.length}
            </span>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search installed packages..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        {loading ? (
          <p className="text-center py-8 text-[var(--text-muted)]">Loading packages...</p>
        ) : filteredPackages.length === 0 ? (
          <p className="text-center py-8 text-[var(--text-muted)]">No packages found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPackages.map(pkg => (
              <div key={pkg.id} className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)]">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-mono font-bold text-brand text-sm truncate">{pkg.name}</h3>
                  <span className="text-xs text-[var(--text-faint)] shrink-0 ml-2">{pkg.version}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2">{pkg.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
