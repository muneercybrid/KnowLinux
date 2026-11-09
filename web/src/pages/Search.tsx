import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search as SearchIcon, ArrowLeft, Box, Terminal, Folder, ArrowRight } from 'lucide-react';

interface SearchResults {
  software: any[];
  commands: any[];
  categories: any[];
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [query]);

  const hasResults = results && (results.software.length > 0 || results.commands.length > 0 || results.categories.length > 0);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
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
          <div className="text-center py-20 text-[var(--text-muted)]">Searching the KnowLinux database...</div>
        ) : !hasResults ? (
          <div className="text-center py-20 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl">
            <SearchIcon className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No results found</h2>
            <p className="text-[var(--text-muted)]">Try searching for a different tool, command, or category.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Software Results */}
            {results.software.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                  <Box className="w-5 h-5 text-brand" /> Software
                </h2>
                <div className="grid gap-4">
                  {results.software.map((app) => (
                    <Link to={`/software/${app.slug}`} key={app.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors flex items-center justify-between group">
                      <div>
                        <h3 className="font-bold group-hover:text-brand transition-colors">{app.name}</h3>
                        <p className="text-sm text-[var(--text-muted)] line-clamp-1">{app.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[var(--text-faint)] group-hover:text-brand transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Command Results */}
            {results.commands.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                  <Terminal className="w-5 h-5 text-brand" /> Commands
                </h2>
                <div className="grid gap-4">
                  {results.commands.map((cmd) => (
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

            {/* Category Results */}
            {results.categories.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
                  <Folder className="w-5 h-5 text-brand" /> Categories
                </h2>
                <div className="grid gap-4">
                  {results.categories.map((cat) => (
                    <Link to={`/explore/${cat.slug}`} key={cat.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors flex items-center justify-between group">
                      <div>
                        <h3 className="font-bold group-hover:text-brand transition-colors">{cat.name}</h3>
                        <p className="text-sm text-[var(--text-muted)] line-clamp-1">{cat.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[var(--text-faint)] group-hover:text-brand transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
