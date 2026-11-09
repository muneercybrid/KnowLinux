import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search as SearchIcon, ArrowLeft, Folder, ArrowRight, Globe } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [localResults, setLocalResults] = useState<any>({ software: [], commands: [], categories: [] });
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDistro, setSelectedDistro] = useState<string>('all');

  useEffect(() => {
    if (!query) return;
    setLoading(true);

    // 1. Fetch local database results
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => setLocalResults(data))
      .catch(err => console.error("Local search failed", err));

    // 2. Fetch live Repology results
    fetch(`/api/live-search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        setLiveResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Live search failed", err);
        setLoading(false);
      });
  }, [query]);

  const hasLocal = localResults.commands?.length > 0 || localResults.software?.length > 0;

  // Extract unique distros for the filter
  const availableDistros = ['all', ...Array.from(new Set(liveResults.map((r: any) => r.distro)))];
  
  // Filter the live results based on selection
  const filteredLiveResults = selectedDistro === 'all' 
    ? liveResults 
    : liveResults.filter((r: any) => r.distro === selectedDistro);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-12">
        <Link to="/" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
            <SearchIcon className="w-6 h-6 text-brand" /> Search Results
          </h1>
          <p className="text-[var(--text-muted)]">
            Showing results for <span className="font-mono text-brand bg-brand/10 px-2 py-1 rounded">"{query}"</span>
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[var(--text-muted)]">Searching the Linux ecosystem...</div>
        ) : (
          <div className="space-y-10">
            {/* Local Results */}
            {hasLocal && (
              <div>
                <h2 className="text-lg font-bold mb-4 border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-brand" /> KnowLinux Database
                </h2>
                <div className="grid gap-4">
                  {localResults.commands.map((cmd: any) => (
                    <Link to={`/commands/${cmd.slug}`} key={cmd.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors flex items-center justify-between group">
                      <div>
                        <h3 className="font-mono font-bold group-hover:text-brand transition-colors">{cmd.name}</h3>
                        <p className="text-sm text-[var(--text-muted)] line-clamp-1">{cmd.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[var(--text-faint)] group-hover:text-brand transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Live Repology Results */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-[var(--border-color)] pb-2 gap-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-brand" /> Live Linux Packages (Repology)
                </h2>
                
                {/* Distro Filter */}
                {liveResults.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <span className="text-sm text-[var(--text-muted)] shrink-0">Filter:</span>
                    {availableDistros.map((distro: any) => (
                      <button
                        key={distro}
                        onClick={() => setSelectedDistro(distro)}
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors border ${
                          selectedDistro === distro 
                            ? 'bg-brand text-dark-bg border-brand' 
                            : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-brand'
                        }`}
                      >
                        {distro}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {filteredLiveResults.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">No live packages found for this filter.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLiveResults.map((pkg: any, i: number) => (
                    <Link to={`/tools/live/${pkg.name}?repo=${pkg.repo}`} key={i} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors group block">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-brand truncate group-hover:underline">{pkg.name}</h3>
                        <span className="text-xs font-mono bg-[var(--bg-elevated)] px-2 py-1 rounded capitalize shrink-0 ml-2">{pkg.distro}</span>
                      </div>
                      <div className="font-mono text-sm bg-[#0d1117] p-2 rounded text-emerald-400 truncate">
                        {pkg.repo}/{pkg.name} (v{pkg.version})
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
