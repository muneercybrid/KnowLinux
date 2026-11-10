import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Box, Terminal, Copy, Check, BookOpen, Download, Wrench } from 'lucide-react';

export default function LiveToolDetail() {
  const { name } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get('view') || 'hub'; 
  const initialDistro = searchParams.get('distro') || 'all';
  
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    fetch(`/api/live-search?q=${encodeURIComponent(name)}`)
      .then(res => res.json())
      .then(data => {
        // Deduplicate exact matches (Repology sometimes returns the same pkg multiple times)
        const uniqueData = Array.isArray(data) ? Array.from(new Map(data.map((item: any) => [item.repo + item.name + item.version, item])).values()) : [];
        setPackages(uniqueData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [name]);

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Group packages by Distro, deduplicating by package name (take first match)
  const groupedByDistro = packages.reduce((acc: any, pkg: any) => {
    if (!acc[pkg.distro]) acc[pkg.distro] = {};
    // Only keep the first package per name to avoid duplicates in the Install view
    if (!acc[pkg.distro][pkg.name]) {
      acc[pkg.distro][pkg.name] = pkg;
    }
    return acc;
  }, {});

  // Filter based on URL param
  const displayDistros = initialDistro === 'all' 
    ? Object.keys(groupedByDistro) 
    : [initialDistro].filter(d => groupedByDistro[d]);

  const getInstallCmd = (distro: string, pkgName: string) => {
    if (['arch', 'aur', 'manjaro'].includes(distro)) return `sudo pacman -S ${pkgName}`;
    if (distro === 'fedora') return `sudo dnf install ${pkgName}`;
    if (['nix', 'nixos'].includes(distro)) return `nix-env -iA nixpkgs.${pkgName}`;
    return `sudo apt install ${pkgName}`; // Default Debian/Ubuntu/Kali/Parrot
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        
        <button 
          onClick={() => {
            if (activeView !== 'hub') {
              setSearchParams({ distro: initialDistro }); // Go back to Hub, keep filter
            } else {
              window.history.back();
            }
          }} 
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-brand/10">
            <Box className="w-8 h-8 text-brand" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-mono text-brand capitalize">{name?.replace(/-/g, ' ')}</h1>
            <p className="text-[var(--text-muted)]">Action Hub</p>
          </div>
        </div>

        {/* HUB VIEW */}
        {activeView === 'hub' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setSearchParams({ view: 'study', distro: initialDistro })} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <BookOpen className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Study Tool</h2>
              <p className="text-sm text-[var(--text-muted)]">Learn what this tool does, its purpose, and available versions.</p>
            </button>

            <button onClick={() => setSearchParams({ view: 'install', distro: initialDistro })} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <Download className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Install</h2>
              <p className="text-sm text-[var(--text-muted)]">Get the exact installation command for your distribution.</p>
            </button>

            <button onClick={() => setSearchParams({ view: 'use', distro: initialDistro })} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <Terminal className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Use</h2>
              <p className="text-sm text-[var(--text-muted)]">Learn commands, syntax, and examples to use this tool.</p>
            </button>

            <button onClick={() => setSearchParams({ view: 'fix', distro: initialDistro })} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <Wrench className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Fix</h2>
              <p className="text-sm text-[var(--text-muted)]">Troubleshoot errors and resolve issues with this tool.</p>
            </button>
          </div>
        )}

        {/* STUDY VIEW (Shows all versions) */}
        {activeView === 'study' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Tool Metadata & Versions</h2>
              {loading ? (
                <p className="text-[var(--text-muted)]">Loading metadata...</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Canonical Name</div>
                      <div className="font-mono text-brand">{name}</div>
                    </div>
                    <div className="p-4 bg-[var(--bg-elevated)] rounded-lg">
                      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Packages</div>
                      <div className="font-mono text-brand">{packages.length}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold mb-3">Detailed Version Breakdown</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {packages.map((pkg, i) => (
                        <div key={i} className="flex justify-between items-center text-sm p-2 rounded bg-[var(--bg-main)] border border-[var(--border-color)]">
                          <span className="font-mono text-brand truncate">{pkg.repo}/{pkg.name}</span>
                          <span className="text-[var(--text-muted)] font-mono">v{pkg.version}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INSTALL VIEW (Clean, 1 per distro) */}
        {activeView === 'install' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Installation Commands</h2>
              {loading ? (
                <p className="text-[var(--text-muted)]">Loading packages...</p>
              ) : displayDistros.length === 0 ? (
                <p className="text-[var(--text-muted)]">No packages found for this tool.</p>
              ) : (
                <div className="space-y-6">
                  {displayDistros.map((distro: string) => {
                    const pkg = Object.values(groupedByDistro[distro])[0] as any;
                    const cmd = getInstallCmd(distro, pkg.name);
                    
                    return (
                      <div key={distro} className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] flex justify-between items-center">
                          <span className="font-bold capitalize">{distro}</span>
                          {/* Version removed from header to keep it clean */}
                        </div>
                        <div className="p-4 flex items-center justify-between gap-4 bg-[var(--bg-main)]">
                          <div className="font-mono text-sm bg-[#0d1117] px-3 py-2 rounded text-emerald-400 flex-grow overflow-x-auto">
                            $ {cmd}
                          </div>
                          <button 
                            onClick={() => handleCopy(cmd)}
                            className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:text-brand transition-colors shrink-0"
                            title="Copy command"
                          >
                            {copiedCmd === cmd ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* USE VIEW */}
        {activeView === 'use' && (
          <div className="p-12 text-center border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)]">
            <Terminal className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Command Usage Coming Soon</h2>
            <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
              We are currently building the AI Command Assistant to generate and explain commands for this tool.
            </p>
            <Link to="/commands/generate" className="bg-brand hover:bg-brand-hover text-dark-bg px-6 py-2 rounded-lg font-semibold transition-colors inline-block">
              Try Command Studio
            </Link>
          </div>
        )}

        {/* FIX VIEW */}
        {activeView === 'fix' && (
          <div className="p-12 text-center border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)]">
            <Wrench className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Troubleshooting</h2>
            <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
              Have an error with this tool? Paste it into KnowLinux Fix to get a solution.
            </p>
            <Link to="/fix" className="bg-brand hover:bg-brand-hover text-dark-bg px-6 py-2 rounded-lg font-semibold transition-colors inline-block">
              Go to KnowLinux Fix
            </Link>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
