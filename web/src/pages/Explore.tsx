import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, Terminal, Server, Box, Network, Code, Shield, Lock, AlertTriangle, Cpu, HardDrive, Database, Wrench, BookOpen } from 'lucide-react';

const iconMap: Record<string, any> = {
  Terminal, Server, Box, Network, Code, Shield, Lock, AlertTriangle, Cpu, HardDrive, Database, Wrench, BookOpen
};

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Explore() {
  const [groupedCategories, setGroupedCategories] = useState<Record<string, any[]>>({});
  const [activeLetter, setActiveLetter] = useState<string>('A');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories/az')
      .then(res => res.json())
      .then(data => {
        setGroupedCategories(data);
        // Set active letter to the first letter that has categories
        const firstAvailable = alphabet.find(l => data[l] && data[l].length > 0);
        if (firstAvailable) setActiveLetter(firstAvailable);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const currentCategories = groupedCategories[activeLetter] || [];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Compass className="w-8 h-8 text-brand" /> A–Z Directory
          </h1>
          <p className="text-[var(--text-muted)]">Browse the entire Linux ecosystem by category.</p>
        </div>

        {/* Alphabet Navigation */}
        <div className="flex flex-wrap gap-1 mb-8 border-b border-[var(--border-color)] pb-4">
          {alphabet.map(letter => {
            const hasItems = groupedCategories[letter] && groupedCategories[letter].length > 0;
            return (
              <button
                key={letter}
                onClick={() => setActiveLetter(letter)}
                disabled={!hasItems}
                className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-colors ${
                  activeLetter === letter 
                    ? 'bg-brand text-dark-bg' 
                    : hasItems 
                      ? 'hover:bg-[var(--bg-elevated)] text-[var(--text-main)] cursor-pointer' 
                      : 'text-[var(--text-faint)] opacity-30 cursor-not-allowed'
                }`}
              >
                {letter}
              </button>
            )
          })}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">Loading categories...</div>
        ) : currentCategories.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            No categories found for letter "{activeLetter}". Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentCategories.map((cat) => {
              const Icon = iconMap[cat.icon] || Terminal;
              return (
                <Link 
                  to={`/explore/${cat.slug}`} 
                  key={cat.id} 
                  className="flex items-start gap-4 p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand hover:shadow-sm transition-all group"
                >
                  <div className="p-2 rounded-md bg-[var(--bg-elevated)] group-hover:bg-brand/10 transition-colors">
                    <Icon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-brand transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-brand transition-colors">{cat.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{cat.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
