import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Box } from 'lucide-react';

export default function CategoryDetail() {
  const { slug } = useParams();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-12">
        <Link to="/explore" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold capitalize mb-2">{slug?.replace('-', ' ')}</h1>
          <p className="text-[var(--text-muted)]">Browse all software and tools in this category.</p>
        </div>

        <div className="p-12 text-center border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)]">
          <Box className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">API Integration Coming Next</h2>
          <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
            We are about to connect the Repology and Debian APIs. Once connected, this page will instantly populate with thousands of packages from this category.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
