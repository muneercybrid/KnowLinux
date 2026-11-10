import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Box, Terminal, Copy, Check, BookOpen, Download, Wrench, Shield, CheckCircle2 } from 'lucide-react';

export default function LiveToolDetail() {
  const { name } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get('view') || 'hub'; 
  const initialDistro = searchParams.get('distro') || 'all';
  
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  
  // State for the interactive command builder in "Use" view
  const [cmdTarget, setCmdTarget] = useState('');

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    fetch(`/api/live-search?q=${encodeURIComponent(name)}`)
      .then(res => res.json())
      .then(data => {
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

  // Group packages by Distro, deduplicating by package name
  const groupedByDistro = packages.reduce((acc: any, pkg: any) => {
    if (!acc[pkg.distro]) acc[pkg.distro] = {};
    if (!acc[pkg.distro][pkg.name]) acc[pkg.distro][pkg.name] = pkg;
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
    return `sudo apt install ${pkgName}`; 
  };

  const getUpdateCmd = (distro: string) => {
    if (['arch', 'aur', 'manjaro'].includes(distro)) return `sudo pacman -Syu`;
    if (distro === 'fedora') return `sudo dnf update`;
    return `sudo apt update`; 
  };

  const setView = (view: string) => {
    setSearchParams({ view, distro: initialDistro });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        
        <button 
          onClick={() => activeView !== 'hub' ? setView('hub') : window.history.back()} 
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
            <p className="text-[var(--text-muted)] capitalize">
              {initialDistro === 'all' ? 'All Distributions' : initialDistro}
            </p>
          </div>
        </div>

        {/* HUB VIEW */}
        {activeView === 'hub' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setView('study')} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <BookOpen className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Study Tool</h2>
              <p className="text-sm text-[var(--text-muted)]">Learn what this tool does, its capabilities, and requirements.</p>
            </button>
            <button onClick={() => setView('install')} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <Download className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Install</h2>
              <p className="text-sm text-[var(--text-muted)]">Step-by-step installation guide for your distribution.</p>
            </button>
            <button onClick={() => setView('use')} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <Terminal className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Use Tool</h2>
              <p className="text-sm text-[var(--text-muted)]">Interactive guide and command generator for this tool.</p>
            </button>
            <button onClick={() => setView('fix')} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors text-left group">
              <Wrench className="w-8 h-8 text-brand mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-bold mb-2 group-hover:text-brand">Fix Issues</h2>
              <p className="text-sm text-[var(--text-muted)]">Troubleshoot errors and resolve problems with this tool.</p>
            </button>
          </div>
        )}

        {/* STUDY VIEW */}
        {activeView === 'study' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand" /> Tool Overview
              </h2>
              <p className="text-[var(--text-main)] mb-6 leading-relaxed">
                <strong>{name}</strong> is a powerful utility available across multiple Linux distributions. 
                It is widely used in the Linux ecosystem and provides critical functionality for its respective domain.
                <span className="block mt-2 text-sm text-[var(--text-muted)] italic">(Note: AI-generated full descriptions are coming soon).</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)]">
                  <h3 className="font-bold text-emerald-500 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Pros</h3>
                  <ul className="text-sm text-[var(--text-muted)] space-y-1 list-disc list-inside">
                    <li>Available in official repositories</li>
                    <li>Actively maintained</li>
                    <li>Cross-distribution support</li>
                  </ul>
                </div>
                <div className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)]">
                  <h3 className="font-bold text-amber-500 mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Requirements</h3>
                  <ul className="text-sm text-[var(--text-muted)] space-y-1 list-disc list-inside">
                    <li>Linux OS (Kali, Ubuntu, Arch, etc.)</li>
                    <li>Terminal access</li>
                    <li>Sudo privileges for installation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
               <h2 className="text-lg font-bold mb-4">Available Versions</h2>
               <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
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

        {/* INSTALL VIEW */}
        {activeView === 'install' && (
          <div className="space-y-6">
            {loading ? (
                <p className="text-[var(--text-muted)]">Loading...</p>
            ) : displayDistros.length === 0 ? (
                <p className="text-[var(--text-muted)]">No packages found for this tool.</p>
            ) : (
              displayDistros.map((distro: string) => {
                const pkg = Object.values(groupedByDistro[distro])[0] as any;
                const installCmd = getInstallCmd(distro, pkg.name);
                const updateCmd = getUpdateCmd(distro);
                
                return (
                  <div key={distro} className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--bg-surface)]">
                    <div className="px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
                      <h2 className="text-lg font-bold capitalize">Installing on {distro}</h2>
                    </div>
                    <div className="p-6 space-y-6">
                      
                      {/* Step 1 */}
                      <div>
                        <h3 className="font-bold mb-2 flex items-center gap-2 text-[var(--text-main)]">
                          <span className="w-6 h-6 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs">1</span> 
                          Update Package List
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] mb-2">Always refresh your package manager before installing new software.</p>
                        <div className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                          <code className="text-emerald-400 font-mono text-sm">$ {updateCmd}</code>
                          <button onClick={() => handleCopy(updateCmd)} className="text-[var(--text-muted)] hover:text-brand"><Copy className="w-4 h-4" /></button>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div>
                        <h3 className="font-bold mb-2 flex items-center gap-2 text-[var(--text-main)]">
                          <span className="w-6 h-6 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs">2</span> 
                          Install {name}
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] mb-2">Run the following command to install the package.</p>
                        <div className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                          <code className="text-emerald-400 font-mono text-sm">$ {installCmd}</code>
                          <button onClick={() => handleCopy(installCmd)} className="text-[var(--text-muted)] hover:text-brand">
                            {copiedCmd === installCmd ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div>
                        <h3 className="font-bold mb-2 flex items-center gap-2 text-[var(--text-main)]">
                          <span className="w-6 h-6 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs">3</span> 
                          Verify Installation
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] mb-2">Confirm the tool is installed correctly.</p>
                        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                          <code className="text-emerald-400 font-mono text-sm">$ {name} --version</code>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* USE VIEW */}
        {activeView === 'use' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <h2 className="text-xl font-bold mb-4 border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-brand" /> Interactive Guide
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text-main)]">
                    What is your target?
                  </label>
                  <input 
                    type="text" 
                    value={cmdTarget}
                    onChange={(e) => setCmdTarget(e.target.value)}
                    placeholder="e.g., 192.168.1.1 or example.com" 
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                  />
                </div>

                <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-lg">
                  <div className="text-xs text-[var(--text-muted)] mb-2 font-mono uppercase">Generated Command</div>
                  <code className="text-emerald-400 font-mono text-lg">
                    $ {name} {cmdTarget ? cmdTarget : '[target]'}
                  </code>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleCopy(`${name} ${cmdTarget}`)}
                    className="flex-1 bg-brand hover:bg-brand-hover text-dark-bg py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" /> Copy Command
                  </button>
                </div>
              </div>
            </div>
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
