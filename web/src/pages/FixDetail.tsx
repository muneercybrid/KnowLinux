import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, AlertTriangle, Wrench, ShieldCheck, Stethoscope, Copy, Check } from 'lucide-react';

export default function FixDetail() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/fix/${slug}`)
      .then(res => res.json())
      .then(data => { setData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)]">Loading...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-red-500">Fix not found.</div>;

  let causes: string[] = []; try { causes = JSON.parse(data.causes); } catch(e) {}
  let diagnostics: string[] = []; try { diagnostics = JSON.parse(data.diagnostics); } catch(e) {}
  let fixes: string[] = []; try { fixes = JSON.parse(data.fixes); } catch(e) {}

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <Link to="/fix" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to KnowLinux Fix
        </Link>
        
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-4">{data.title}</h1>
          <div className="bg-[#0d1117] p-4 rounded-lg border border-[#30363d] text-red-400 font-mono text-sm overflow-x-auto">
            <code>{data.errorSignature}</code>
          </div>
        </div>

        <div className="space-y-8">
          {/* Explanation */}
          <section className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-brand" /> What this means</h2>
            <p className="text-[var(--text-muted)] leading-relaxed">{data.explanation}</p>
          </section>

          {/* Causes */}
          <section className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Wrench className="w-5 h-5 text-amber-500" /> Possible Causes</h2>
            <ul className="list-disc list-inside space-y-2 text-[var(--text-muted)]">
              {causes.map((cause, i) => <li key={i}>{cause}</li>)}
            </ul>
          </section>

          {/* Diagnostics */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Stethoscope className="w-5 h-5 text-blue-400" /> 1. Safe Diagnostics (Read-Only)</h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">Run these commands first to confirm the issue. They will not modify your system.</p>
            <div className="space-y-3">
              {diagnostics.map((cmd, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-[var(--border-color)] bg-[#0d1117]">
                  <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-b border-[#30363d]">
                    <span className="text-xs text-[var(--text-muted)]">Diagnostic {i + 1}</span>
                    <button onClick={() => handleCopy(cmd)} className="text-xs text-[var(--text-muted)] hover:text-brand flex items-center gap-1">
                      {copiedCmd === cmd ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copy
                    </button>
                  </div>
                  <div className="p-3 font-mono text-sm text-blue-300 overflow-x-auto"><code>$ {cmd}</code></div>
                </div>
              ))}
            </div>
          </section>

          {/* Fixes */}
          <section>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> 2. Recommended Fix</h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">Once confirmed, apply the fix. Note that some commands may require <code className="text-brand">sudo</code> privileges.</p>
            <div className="space-y-3">
              {fixes.map((cmd, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-[var(--border-color)] bg-[#0d1117]">
                  <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-b border-[#30363d]">
                    <span className="text-xs text-[var(--text-muted)]">Step {i + 1}</span>
                    <button onClick={() => handleCopy(cmd)} className="text-xs text-[var(--text-muted)] hover:text-brand flex items-center gap-1">
                      {copiedCmd === cmd ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} Copy
                    </button>
                  </div>
                  <div className="p-3 font-mono text-sm text-emerald-400 overflow-x-auto"><code>$ {cmd}</code></div>
                </div>
              ))}
            </div>
          </section>

          {/* Verification */}
          <section className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Check className="w-5 h-5 text-emerald-500" /> Verification</h2>
            <p className="text-[var(--text-muted)]">{data.verification}</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
