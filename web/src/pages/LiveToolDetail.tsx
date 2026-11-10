import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Box, Terminal, Copy, Check, BookOpen, Download, Wrench, ChevronRight } from 'lucide-react';

export default function LiveToolDetail() {
  const { name } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get('view') || 'hub'; // 'hub', 'study', 'install', 'fix', 'use'
  
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    fetch(`/api/live-search?q=${encodeURIComponent(name)}`)
      .then(res => res.json())
      .then(data => {
        setPackages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [name]);

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Group packages by Distro for the Install view
  const groupedByDistro = packages.reduce((acc: any, pkg: any) => {
    if (!acc[pkg.distro]) acc[pkg.distro] = [];
    acc[pkg.distro].push(pkg);
    return acc;
  }, {});

  // Generate a generic install command based on distro
  const getInstallCmd = (distro: string, pkgName: string) => {
    if (['arch', 'aur', 'manjaro'].includes(distro)) return `sudo pacman -S ${pkgName}`;
    if (distro === 'fedora') return `sudo dnf install ${pkgName}`;
    if (['nix', 'nixos'].includes(distro)) return `nix-env -iA nixpkgs.${pkgName}`;
    return `sudo apt install ${pkgName}`; // Default to Debian/Ubuntu/Kali
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        
        {/* Breadcrumb / Back Button */}
        <button 
          onClick={() => {
            if (activeView !== 'hub') setSearchParams({}); // Go back to Hub
            else window.history.back(); // Go back to Search
          }} 
          className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-brand/10">
            <Box className="w-8 h-8 text-brand" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-mono text-brand capitalize">{name?.replace(/-/g, ' ')}</h1>
            <p className="text-[var(--text-muted)]">Action Hub</p>
          </div>
        </div>

        {/* ---------------- HUB VIEW ---------------- */}
        {activeView === 'hub' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setSearchParams({ view: 'study' })} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <BookOpen className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Study Tool</h2>
              <p className="text-sm text-[var(--text-muted)]">Learn what this tool does, its purpose, and where it comes from.</p>
            </button>

            <button onClick={() => setSearchParams({ view: 'install' })} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <Download className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Install</h2>
              <p className="text-sm text-[var(--text-muted)]">Get the exact installation command for your Linux distribution.</p>
            </button>

            <button onClick={() => setSearchParams({ view: 'use' })} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <Terminal className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Use</h2>
              <p className="text-sm text-[var(--text-muted)]">Learn commands, syntax, and examples to use this tool.</p>
            </button>

            <button onClick={() => setSearchParams({ view: 'fix' })} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <Wrench className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Fix</h2>
              <p className="text-sm text-[var(--text-muted)]">Troubleshoot errors and resolve issues with this tool.</p>
            </button>
          </div>
        )}

        {/* ---------------- STUDY VIEW ---------------- */}
        {activeView === 'study' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Tool Overview</h2>
              {loading ? (
                <p className="text-[var(--text-muted)]">Loading metadata...</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-[var(--text-main)]">
                    This tool is tracked in the Repology database. It is available across {Object.keys(groupedByDistro).length} Linux distributions/ecosystems.
                  </p>
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- INSTALL VIEW ---------------- */}
        {activeView === 'install' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2">Installation Instructions</h2>
              {loading ? (
                <p className="text-[var(--text-muted)]">Loading packages...</p>
              ) : Object.keys(groupedByDistro).length === 0 ? (
                <p className="text-[var(--text-muted)]">No packages found for this tool.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedByDistro).map(([distro, pkgs]: [string, any]) => {
                    // Only show the first package per distro for simplicity
                    const pkg = pkgs[0];
                    const cmd = getInstallCmd(distro, pkg.name);
                    
                    return (
                      <div key={distro} className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] flex justify-between items-center">
                          <span className="font-bold capitalize">{distro}</span>
                          <span className="text-xs text-[var(--text-muted)] font-mono">v{pkg.version}</span>
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

        {/* ---------------- USE VIEW ---------------- */}
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

        {/* ---------------- FIX VIEW ---------------- */}
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
