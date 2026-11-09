import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';
import { Terminal, ArrowRight } from 'lucide-react';

export default function ToolsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => { setTools(data); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Terminal className="w-8 h-8 text-brand" /> All Linux Tools
          </h1>
          <p className="text-[var(--text-muted)]">Browse the comprehensive directory of Linux utilities and applications.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-[var(--text-muted)]">Loading tools...</div>
          ) : tools.map((tool) => (
            <Link to={`/tools/${tool.slug}`} key={tool.id} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors group">
              <h3 className="text-lg font-bold mb-2 group-hover:text-brand transition-colors">{tool.name}</h3>
              <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-4">{tool.description}</p>
              <div className="flex items-center text-sm font-medium text-brand">
                View Packages <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
