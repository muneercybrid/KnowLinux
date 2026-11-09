import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search, Terminal, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Command {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
}

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/commands')
      .then(res => res.json())
      .then(data => {
        setCommands(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-12">
        <Link to="/" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center justify-between"><div className="flex items-center justify-between"><h1 className="text-3xl font-bold flex items-center gap-3">
              <Terminal className="w-8 h-8 text-brand" /> Command Studio
            </h1>
            <p className="text-[var(--text-muted)] mt-2">Explore Linux commands, understand their syntax, and discover examples.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
            <input 
              type="text" 
              placeholder="Search commands..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-[var(--text-muted)]">Loading commands...</div>
          ) : commands.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[var(--text-muted)]">No commands found.</div>
          ) : (
            commands.map((cmd) => (
              <Link to={`/commands/${cmd.slug}`} key={cmd.id} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors cursor-pointer group block">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center font-mono font-bold text-lg text-brand">
                    $
                  </div>
                  <span className="text-xs font-mono px-2 py-1 bg-[var(--bg-elevated)] rounded border border-[var(--border-color)]">{cmd.category}</span>
                </div>
                <h3 className="text-xl font-mono font-bold mb-2 group-hover:text-brand transition-colors">{cmd.name}</h3>
                <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-4">{cmd.description}</p>
                <div className="flex items-center text-sm font-medium text-brand">
                  View Details <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
