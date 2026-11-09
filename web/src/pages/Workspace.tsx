import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Terminal, Trash2, Copy, Check } from 'lucide-react';

interface SavedCommand {
  id: number;
  command: string;
  description: string;
  createdAt: string;
}

export default function Workspace() {
  const { user } = useAuth();
  const [savedCommands, setSavedCommands] = useState<SavedCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/workspace/commands')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSavedCommands(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCopy = (cmd: string, id: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this saved command?')) return;
    await fetch(`/api/workspace/commands/${id}`, { method: 'DELETE' });
    setSavedCommands(savedCommands.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Workspace</h1>
            <p className="text-[var(--text-muted)]">Welcome back, {user?.name || user?.email}</p>
          </div>
          <Link to="/commands" className="bg-brand hover:bg-brand-hover text-dark-bg px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
            Find Commands
          </Link>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
            <Terminal className="w-6 h-6 text-brand" />
            <h2 className="text-xl font-bold">Saved Commands</h2>
            <span className="bg-[var(--bg-elevated)] text-[var(--text-muted)] text-xs px-2 py-1 rounded-full">
              {savedCommands.length}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[var(--text-muted)]">Loading saved commands...</div>
          ) : savedCommands.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)]">
              <Terminal className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-4" />
              <p className="text-[var(--text-muted)] mb-4">You haven't saved any commands yet.</p>
              <Link to="/commands/generate" className="text-brand hover:underline">Go to Command Generator</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {savedCommands.map((cmd) => (
                <div key={cmd.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                  <div>
                    <h3 className="font-bold text-sm mb-1">{cmd.description}</h3>
                    <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d] font-mono text-sm text-emerald-400 overflow-x-auto">
                      <code>$ {cmd.command}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => handleCopy(cmd.command, cmd.id)}
                      className="p-2 rounded-lg bg-[var(--bg-elevated)] hover:text-brand transition-colors border border-[var(--border-color)]"
                      title="Copy command"
                    >
                      {copiedId === cmd.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleDelete(cmd.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20"
                      title="Delete command"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
