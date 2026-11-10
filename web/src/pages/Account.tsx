import { useEffect, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { ArrowLeft, User, Mail, Shield, Monitor, Trash2, Cpu, Terminal } from 'lucide-react'

interface Device {
  id: number
  name: string
  osInfo: string
  lastSeenAt: string
  createdAt: string
}

export default function Account() {
  const { user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDevices = () => {
    fetch('/api/companion/devices')
      .then(res => res.json())
      .then(data => {
        setDevices(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (user) fetchDevices()
  }, [user])

  const handleDisconnect = async (id: number) => {
    if (!confirm('Are you sure you want to disconnect this device? The Companion agent will stop working.')) return
    await fetch(`/api/companion/devices/${id}`, { method: 'DELETE' })
    fetchDevices()
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <Link to="/workspace" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspace
        </Link>
        
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center text-brand text-2xl font-bold uppercase">
                {user.name?.charAt(0) || user.email.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.name || 'User'}</h2>
                <p className="text-[var(--text-muted)]">Free Member</p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-5 h-5 text-[var(--text-faint)]" />
                <div>
                  <p className="font-medium text-[var(--text-main)]">Display Name</p>
                  <p className="text-[var(--text-muted)]">{user.name || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-[var(--text-faint)]" />
                <div>
                  <p className="font-medium text-[var(--text-main)]">Email Address</p>
                  <p className="text-[var(--text-muted)]">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-[var(--text-faint)]" />
                <div>
                  <p className="font-medium text-[var(--text-main)]">Account Security</p>
                  <p className="text-[var(--text-muted)]">Password protected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Devices */}
          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Monitor className="w-6 h-6 text-brand" />
                <h2 className="text-xl font-bold">Connected Machines</h2>
              </div>
              <Link to="/activate" className="bg-brand hover:bg-brand-hover text-dark-bg px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                Connect New
              </Link>
            </div>

            {loading ? (
              <p className="text-center py-8 text-[var(--text-muted)]">Loading devices...</p>
            ) : devices.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[var(--border-color)] rounded-lg">
                <Terminal className="w-10 h-10 text-[var(--text-faint)] mx-auto mb-3" />
                <p className="text-[var(--text-muted)] mb-3">No machines connected yet.</p>
                <p className="text-xs text-[var(--text-faint)] mb-4">Install the Companion agent on your Linux machine and run:</p>
                <code className="text-xs bg-[#0d1117] px-3 py-1 rounded border border-[#30363d] text-emerald-400">knowlinux-agent connect</code>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => {
                  let osInfo: any = {}
                  try { osInfo = JSON.parse(device.osInfo || '{}') } catch (e) {}
                  
                  return (
                    <div key={device.id} className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Cpu className="w-4 h-4 text-brand" />
                          <span className="font-bold">{osInfo.hostname || device.name}</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          {osInfo.distro || 'Unknown OS'} · {osInfo.arch || ''} · Kernel {osInfo.kernel || ''}
                        </p>
                        <p className="text-xs text-[var(--text-faint)] mt-1">
                          Last scan: {new Date(device.lastSeenAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/account/devices/${device.id}`}
                          className="text-xs bg-[var(--bg-elevated)] hover:border-brand border border-[var(--border-color)] px-3 py-2 rounded-lg transition-colors"
                        >
                          View Tools
                        </Link>
                        <button 
                          onClick={() => handleDisconnect(device.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="Disconnect"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/5">
            <h3 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Once you delete your account, there is no going back.</p>
            <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
