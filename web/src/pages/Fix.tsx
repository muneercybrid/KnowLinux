import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';
import { AlertTriangle, Search, ArrowRight } from 'lucide-react';

export default function FixPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/fix?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
            Paste your error message, failed command, or log output below. We will search our verified database for a solution.
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
              disabled={loading}
              className="absolute bottom-4 right-4 bg-brand hover:bg-brand-hover text-dark-bg px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Diagnosing...' : <><Search className="w-4 h-4" /> Diagnose</>}
            </button>
          </div>
        </form>

        {results !== null && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Possible Matches</h2>
            {results.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl">
                No matching fixes found in our database yet. Our AI assistant (coming soon) will be able to help with this!
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((r) => (
                  <Link to={`/fix/${r.slug}`} key={r.id} className="block p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold mb-2 group-hover:text-brand transition-colors">{r.title}</h3>
                        <p className="text-sm text-[var(--text-muted)] font-mono bg-[#0d1117] p-2 rounded border border-[#30363d] inline-block">
                          {r.errorSignature}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[var(--text-faint)] group-hover:text-brand transition-colors mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
