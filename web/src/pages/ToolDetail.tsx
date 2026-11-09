import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Box, Terminal } from 'lucide-react';

export default function ToolDetail() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tools/${slug}`)
      .then(res => res.json())
      .then(data => { setData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)]">Loading...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-red-500">Tool not found.</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <Link to={`/explore`} className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-brand/10">
            <Box className="w-8 h-8 text-brand" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{data.name}</h1>
            <p className="text-[var(--text-muted)]">{data.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-b border-[var(--border-color)] pb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Terminal className="w-5 h-5 text-brand" /> Available Packages
            </h2>
          </div>

          {data.packages.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)]">No packages found for this tool yet. Check back later!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.packages.map((pkg: any) => (
                <div key={pkg.id} className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-brand capitalize">{pkg.distro}</span>
                    <span className="text-xs font-mono bg-[var(--bg-elevated)] px-2 py-1 rounded">{pkg.repo}</span>
                  </div>
                  <div className="font-mono text-sm bg-[#0d1117] p-2 rounded text-emerald-400 mb-2">
                    {pkg.packageName} (v{pkg.version})
                  </div>
                  <div className="text-xs text-[var(--text-faint)]">Source: {pkg.source}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
