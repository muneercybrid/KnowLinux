import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search, Box, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Software {
  id: number;
  name: string;
  description: string;
  category: string;
}

export default function SoftwarePage() {
  const [software, setSoftware] = useState<Software[]>([]);

  useEffect(() => {
    fetch('/api/software')
      .then(res => res.json())
      .then(data => setSoftware(data))
      .catch(err => console.error(err));
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
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Box className="w-8 h-8 text-brand" /> Software Centre
            </h1>
            <p className="text-[var(--text-muted)] mt-2">Discover software and get complete installation instructions for your distribution.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
            <input 
              type="text" 
              placeholder="Search software..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {software.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[var(--text-muted)]">Loading software...</div>
          ) : (
            software.map((app) => (
              <div key={app.id} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
                    <Box className="w-6 h-6 text-[var(--text-muted)] group-hover:text-brand transition-colors" />
                  </div>
                  <span className="text-xs font-mono px-2 py-1 bg-[var(--bg-elevated)] rounded border border-[var(--border-color)]">{app.category}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-brand transition-colors">{app.name}</h3>
                <p className="text-sm text-[var(--text-muted)] line-clamp-3 mb-4">{app.description}</p>
                <div className="flex items-center text-sm font-medium text-brand">
                  View Install Guide <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
