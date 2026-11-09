import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Box, Terminal, Copy, Check } from 'lucide-react';

export default function LiveToolDetail() {
  const { name } = useParams();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    if (!name) return;
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

  // Group packages by Distro
  const groupedByDistro = packages.reduce((acc: any, pkg: any) => {
    if (!acc[pkg.distro]) acc[pkg.distro] = [];
    acc[pkg.distro].push(pkg);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <Link to="/search" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-brand/10">
            <Box className="w-8 h-8 text-brand" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-mono text-brand">{name}</h1>
            <p className="text-[var(--text-muted)]">Live package data from Repology across all Linux distributions.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">Loading package data...</div>
        ) : Object.keys(groupedByDistro).length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)]">
            <Terminal className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Packages Found</h2>
            <p className="text-[var(--text-muted)]">Repology does not have data for this tool.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByDistro).map(([distro, pkgs]: [string, any]) => (
              <div key={distro} className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[var(--bg-surface)]">
                <div className="px-4 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] flex justify-between items-center">
                  <h2 className="text-lg font-bold capitalize">{distro}</h2>
                  <span className="text-xs font-mono text-[var(--text-muted)]">{pkgs.length} packages</span>
                </div>
                <div className="p-4 space-y-3">
                  {pkgs.map((pkg: any, i: number) => {
                    // Generate a generic install command based on distro family
                    let installCmd = `sudo apt install ${pkg.name}`;
                    if (distro === 'arch' || distro === 'aur' || distro === 'manjaro') installCmd = `sudo pacman -S ${pkg.name}`;
                    if (distro === 'fedora') installCmd = `sudo dnf install ${pkg.name}`;
                    if (distro === 'nix' || distro === 'nixos') installCmd = `nix-env -iA nixpkgs.${pkg.name}`;
                    
                    return (
                      <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] gap-3">
                        <div>
                          <div className="font-mono text-sm text-brand font-bold">{pkg.repo}/{pkg.name}</div>
                          <div className="text-xs text-[var(--text-muted)] mt-1">Version: {pkg.version}</div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="font-mono text-xs bg-[#0d1117] px-3 py-2 rounded text-emerald-400 overflow-x-auto">
                             {installCmd}
                           </div>
                           <button 
                             onClick={() => handleCopy(installCmd)}
                             className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:text-brand transition-colors"
                             title="Copy install command"
                           >
                             {copiedCmd === installCmd ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                           </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
