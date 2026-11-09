import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Terminal, Copy, Check, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Example { desc: string; cmd: string; }
interface CommandData { name: string; description: string; syntax: string; category: string; examples: string; }

export default function CommandDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<CommandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/commands/${slug}`)
      .then(res => { if (!res.ok) throw new Error('Command not found'); return res.json(); })
      .then((data: CommandData) => { setData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSave = async (cmd: string, desc: string, index: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSavingIndex(index);
    try {
      const res = await fetch('/api/workspace/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, description: desc })
      });
      if (res.ok) {
        setSavedIndex(index);
        setTimeout(() => setSavedIndex(null), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingIndex(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)]">Loading...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-red-500">Command not found.</div>;

  let examples: Example[] = [];
  try { examples = JSON.parse(data.examples); } catch (e) {}

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <Link to="/commands" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Command Studio
        </Link>
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-mono font-bold text-brand">{data.name}</h1>
            <span className="text-xs font-mono px-2 py-1 bg-[var(--bg-elevated)] rounded border border-[var(--border-color)]">{data.category}</span>
          </div>
          <p className="text-xl text-[var(--text-muted)]">{data.description}</p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Terminal className="w-5 h-5 text-brand" /> Syntax</h2>
            <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[#0d1117] overflow-x-auto">
              <code className="font-mono text-sm text-blue-400">{data.syntax}</code>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3">Examples</h2>
            <div className="space-y-4">
              {examples.map((ex, i) => (
                <div key={i} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden">
                  <div className="px-4 py-2 border-b border-[var(--border-color)] text-sm text-[var(--text-muted)] bg-[var(--bg-elevated)] flex justify-between items-center">
                    <span>{ex.desc}</span>
                  </div>
                  <div className="relative group">
                    <div className="p-4 overflow-x-auto bg-[#0d1117]">
                      <pre className="font-mono text-sm text-emerald-400"><code>$ {ex.cmd}</code></pre>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleSave(ex.cmd, ex.desc, i)}
                        disabled={savingIndex === i}
                        className="p-2 rounded bg-[#161b22] border border-[#30363d] text-[var(--text-muted)] hover:text-brand transition-colors"
                        title="Save to Workspace"
                      >
                        {savedIndex === i ? <Check className="w-4 h-4 text-emerald-500" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleCopy(ex.cmd, i)}
                        className="p-2 rounded bg-[#161b22] border border-[#30363d] text-[var(--text-muted)] hover:text-brand transition-colors"
                        title="Copy command"
                      >
                        {copiedIndex === i ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
