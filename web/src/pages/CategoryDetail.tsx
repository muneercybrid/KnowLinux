import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Box, Network, Shield, Lock, Terminal, ChevronRight } from 'lucide-react';

const iconMap: Record<string, any> = { Box, Network, Shield, Lock, Terminal };

export default function CategoryDetail() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/categories/${slug}`)
      .then(res => res.json())
      .then(data => { setData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)]">Loading...</div>;
  if (!data || data.error) return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-red-500">Category not found.</div>;

  const Icon = iconMap[data.icon] || Terminal;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-12">
        <Link to="/explore" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-brand/10">
            <Icon className="w-8 h-8 text-brand" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{data.name}</h1>
            <p className="text-[var(--text-muted)]">{data.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sub-categories */}
          {data.children && data.children.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4 border-b border-[var(--border-color)] pb-2">Sub-Categories</h2>
              <div className="space-y-3">
                {data.children.map((child: any) => (
                  <Link to={`/explore/${child.slug}`} key={child.id} className="flex items-center justify-between p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors group">
                    <span className="font-medium group-hover:text-brand">{child.name}</span>
                    <ChevronRight className="w-4 h-4 text-[var(--text-faint)] group-hover:text-brand" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {data.tools && data.tools.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4 border-b border-[var(--border-color)] pb-2">Tools in this Category</h2>
              <div className="space-y-3">
                {data.tools.map((tool: any) => (
                  <div key={tool.id} className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)]">
                    <h3 className="font-bold text-brand">{tool.name}</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">{tool.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {(!data.children || data.children.length === 0) && (!data.tools || data.tools.length === 0) && (
          <div className="p-12 text-center border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)]">
            <Box className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Category Empty</h2>
            <p className="text-[var(--text-muted)]">No sub-categories or tools have been added here yet.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
