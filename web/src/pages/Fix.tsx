import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Search, Stethoscope, ShieldCheck, Copy, Check, Loader2, Bot } from 'lucide-react';

interface AIResponse {
  diagnostics: string[];
  fixes: string[];
  explanation: string;
}

export default function FixPage() {
  const [query, setQuery] = useState('');
  const [dbResults, setDbResults] = useState<any[] | null>(null);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  
  // Separate loading states for DB and AI for better UX
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Reset states
    setDbResults(null);
    setAiResult(null);
    setAiError(null);
    setIsDbLoading(true);
    setIsAiLoading(true);

    // 1. Search local database (Fast)
    try {
      const res = await fetch(`/api/fix?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setDbResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDbLoading(false);
    }

    // 2. Call AI (Slow)
    try {
      const res = await fetch('/api/fix/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorMessage: query })
      });
      
      if (res.status === 401) {
        setAiError('Please log in to use the AI assistant.');
      } else {
        const data = await res.json();
        if (res.ok) {
          setAiResult(data);
        } else {
          setAiError(data.error || 'AI failed to analyze the error.');
        }
      }
    } catch (err: any) {
      setAiError('Failed to connect to AI service.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/10 mb-6">
            <AlertTriangle className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">What is going wrong with your Linux system?</h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Paste your error message, failed command, or log output below. Our deterministic engine will check the database, and our AI will generate a custom solution.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-12">
          <div className="relative group max-w-3xl mx-auto">
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Could not get lock /var/lib/dpkg/lock-frontend..."
              className="w-full h-32 p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-brand resize-none font-mono text-sm shadow-sm transition-all"
            />
            <button 
              type="submit" 
              disabled={isDbLoading || isAiLoading}
              className="absolute bottom-4 right-4 bg-brand hover:bg-brand-hover text-dark-bg px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isAiLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Search className="w-4 h-4" /> Diagnose</>
              )}
            </button>
          </div>
        </form>

        <div className="space-y-8 max-w-3xl mx-auto">
          {/* Local Database Matches */}
          {dbResults !== null && dbResults.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Verified Fixes (Database)</h2>
              <div className="space-y-4">
                {dbResults.map((r) => (
                  <Link to={`/fix/${r.slug}`} key={r.id} className="block p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors group">
                    <h3 className="text-lg font-bold mb-1 group-hover:text-brand transition-colors">{r.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] font-mono bg-[#0d1117] p-2 rounded border border-[#30363d] inline-block">
                      {r.errorSignature}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* AI Loading Skeleton */}
          {isAiLoading && (
            <div className="p-6 rounded-xl border border-brand/30 bg-brand/5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="w-6 h-6 text-brand" />
                <h2 className="text-xl font-bold text-brand">AI is analyzing your error...</h2>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-full"></div>
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-5/6"></div>
                <div className="h-4 bg-[var(--bg-elevated)] rounded w-4/6"></div>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-4">
                Generating safe diagnostic steps and fixes using NVIDIA NIM...
              </p>
            </div>
          )}

          {/* AI Error State */}
          {aiError && !isAiLoading && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-center">
              {aiError}
              {aiError.includes('log in') && (
                <button onClick={() => navigate('/login')} className="ml-2 underline font-bold">Log In Here</button>
              )}
            </div>
          )}

          {/* AI Generated Response */}
          {aiResult && !isAiLoading && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-brand" /> AI Analysis
              </h2>

              <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                <h3 className="font-bold text-lg mb-2">Explanation</h3>
                <p className="text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed">{aiResult.explanation}</p>
              </div>

              {aiResult.diagnostics && aiResult.diagnostics.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-blue-400">
                    <Search className="w-5 h-5" /> Safe Diagnostics (Read-Only)
                  </h3>
                  <div className="space-y-3">
                    {aiResult.diagnostics.map((cmd, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                        <code className="text-blue-300 font-mono text-sm overflow-x-auto">$ {cmd}</code>
                        <button onClick={() => handleCopy(cmd)} className="text-[var(--text-muted)] hover:text-brand ml-2 shrink-0">
                          {copiedCmd === cmd ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiResult.fixes && aiResult.fixes.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-emerald-500">
                    <ShieldCheck className="w-5 h-5" /> Recommended Fix
                  </h3>
                  <div className="space-y-3">
                    {aiResult.fixes.map((cmd, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                        <code className="text-emerald-400 font-mono text-sm overflow-x-auto">$ {cmd}</code>
                        <button onClick={() => handleCopy(cmd)} className="text-[var(--text-muted)] hover:text-brand ml-2 shrink-0">
                          {copiedCmd === cmd ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isAiLoading && dbResults !== null && dbResults.length === 0 && !aiResult && !aiError && (
             <div className="text-center py-8 text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl">
               No matching fixes found in our database.
             </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
