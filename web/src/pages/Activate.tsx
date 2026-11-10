import { useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Terminal, CheckCircle2 } from 'lucide-react'

export default function Activate() {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return navigate('/login')
    setStatus('loading')
    try {
      const res = await fetch('/api/companion/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('success')
    } catch (err: any) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-center">
          <Terminal className="w-12 h-12 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connect your Linux machine</h1>
          <p className="text-sm text-[var(--text-muted)] mb-8">Enter the 6-digit code shown in your terminal.</p>
          {status === 'success' ? (
            <div className="text-emerald-500 bg-emerald-500/10 p-6 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
              <h2 className="font-bold">Device Connected!</h2>
              <p className="text-sm mt-1">Your machine is now linked to your KnowLinux account.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === 'error' && (
                <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">{errorMsg}</div>
              )}
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3"
                maxLength={6}
                className="w-full text-center tracking-[1em] font-mono text-2xl px-4 py-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] focus:outline-none focus:ring-2 focus:ring-brand uppercase"
              />
              <button
                type="submit"
                disabled={code.length < 6 || status === 'loading'}
                className="w-full bg-brand hover:bg-brand-hover text-dark-bg py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? 'Connecting...' : 'Connect Device'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
