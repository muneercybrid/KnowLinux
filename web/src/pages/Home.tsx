import { Search, Terminal, Shield, BookOpen, Wrench, AlertTriangle, ArrowRight, Box, Code, Server, Database, HardDrive, Network, Lock, Cpu } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const iconMap: Record<string, any> = {
  Terminal, Server, Box, Network, Code, Shield, Lock, AlertTriangle, Cpu, HardDrive, Database, Wrench
};

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Failed to load categories", err));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand/10 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-block px-3 py-1 rounded-full border border-brand/30 bg-brand/10 text-brand text-xs font-semibold tracking-wider uppercase mb-4">
              The Linux Knowledge and Productivity Platform
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Understand Linux.<br />
              <span className="text-brand">Master the Terminal.</span><br />
              Secure the Digital World.
            </h1>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              Learn Linux, discover software, generate commands, solve system problems, and develop practical technical skills across distributions.
            </p>
            
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-faint)] group-focus-within:text-brand transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commands, software, Linux errors, tools, and guides..." 
                className="w-full pl-12 pr-16 py-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-lg text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent shadow-sm transition-all"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono bg-[var(--bg-elevated)] text-[var(--text-faint)] px-2 py-1 rounded border border-[var(--border-color)] hover:text-brand transition-colors">Enter</button>
            </form>
            
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <span>Suggested:</span>
              {['Install Docker on Kali', 'Configure SSH on Ubuntu', 'Fix APT repository errors', 'Find listening ports'].map(term => (
                <button 
                  key={term} 
                  onClick={() => {
                    setSearchQuery(term);
                  }}
                  className="px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-brand hover:text-brand transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-[var(--bg-surface)] border-y border-[var(--border-color)]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Core Platform</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Command Studio', desc: 'Generate and understand Linux commands for your environment.', icon: Terminal, action: 'Explore Commands', path: '/commands' },
                { title: 'Software Centre', desc: 'Find software and get complete installation instructions for your distro.', icon: Box, action: 'Explore Software', path: '/software' },
                { title: 'KnowLinux Fix', desc: 'Understand Linux errors and find safe troubleshooting procedures.', icon: AlertTriangle, action: 'Diagnose a Problem', path: '/fix' },
                { title: 'Linux Guides', desc: 'Learn Linux through structured, practical tutorials.', icon: BookOpen, action: 'Browse Guides', path: '/guides' },
              ].map((feature, i) => (
                <Link to={feature.path} key={i} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-brand transition-colors group cursor-pointer flex flex-col h-full">
                  <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] flex-grow mb-6">{feature.desc}</p>
                  <div className="flex items-center text-brand text-sm font-medium">
                    {feature.action} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Explore Linux</h2>
              <a href="#" className="text-sm font-medium text-brand hover:underline">View all categories</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.length === 0 ? (
                <div className="col-span-full text-center py-12 text-[var(--text-muted)]">
                  Loading categories...
                </div>
              ) : (
                categories.map((cat, i) => {
                  const Icon = iconMap[cat.icon] || Terminal;
                  return (
                    <Link to={`/explore/${cat.slug}`} key={i} className="flex items-start gap-4 p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand hover:shadow-sm transition-all cursor-pointer group">
                      <div className="p-2 rounded-md bg-[var(--bg-elevated)] group-hover:bg-brand/10 transition-colors">
                        <Icon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-brand transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-brand transition-colors">{cat.name}</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{cat.description}</p>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
