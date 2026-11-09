import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Box, Copy, Check, Terminal, AlertTriangle } from 'lucide-react';

interface DistroCommand {
  name: string;
  slug: string;
  command: string;
}

interface SoftwareDetailData {
  name: string;
  description: string;
  category: string;
  distributions: DistroCommand[];
}

export default function SoftwareDetail() {
  const { slug } = useParams();
  const [data, setData] = useState<SoftwareDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDistro, setSelectedDistro] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/software/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Software not found');
        return res.json();
      })
      .then((data: SoftwareDetailData) => {
        setData(data);
        if (data.distributions.length > 0) {
          // Default to Kali if available, otherwise first item
          const kali = data.distributions.find(d => d.slug === 'kali');
          setSelectedDistro(kali ? 'kali' : data.distributions[0].slug);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  const activeCommand = data?.distributions.find(d => d.slug === selectedDistro)?.command || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)]">Loading...</div>;
  if (error || !data) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-red-500">{error || 'Not found'}</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <Link to="/software" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Software Centre
        </Link>
        
        {/* Header */}
        <div className="flex items-start gap-6 mb-12">
          <div className="w-20 h-20 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
            <Box className="w-10 h-10 text-brand" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{data.name}</h1>
              <span className="text-xs font-mono px-2 py-1 bg-[var(--bg-elevated)] rounded border border-[var(--border-color)]">{data.category}</span>
            </div>
            <p className="text-lg text-[var(--text-muted)]">{data.description}</p>
          </div>
        </div>

        {/* Installation Section */}
        <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[var(--border-color)]">
            <h2 className="text-xl font-bold mb-4">Installation Instructions</h2>
            
            {data.distributions.length === 0 ? (
              <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-4 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
                <p>No installation commands available for this software yet.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-[var(--text-muted)] mb-4">Select your Linux distribution to see the correct command:</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {data.distributions.map((distro) => (
                    <button
                      key={distro.slug}
                      onClick={() => setSelectedDistro(distro.slug)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedDistro === distro.slug 
                          ? 'bg-brand text-dark-bg' 
                          : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-brand border border-[var(--border-color)]'
                      }`}
                    >
                      {distro.name}
                    </button>
                  ))}
                </div>

                {/* Terminal Box */}
                <div className="relative group rounded-lg overflow-hidden border border-[var(--border-color)] bg-[#0d1117]">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Terminal className="w-4 h-4" />
                      <span>Terminal</span>
                    </div>
                    <button 
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-brand transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <pre className="font-mono text-sm text-emerald-400">
                      <code>{activeCommand}</code>
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="p-6 bg-[var(--bg-elevated)] text-sm text-[var(--text-muted)]">
            <p><strong>Note:</strong> These commands are for informational purposes. Always verify commands and ensure you have the correct privileges (usually <code className="text-brand">sudo</code>) before running them on your system.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
