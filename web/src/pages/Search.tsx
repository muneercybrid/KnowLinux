import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <Link to="/" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <SearchIcon className="w-8 h-8 text-brand" />
          <h1 className="text-3xl font-bold">Search Results</h1>
        </div>
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl">
          <p className="text-lg">
            You searched for: <span className="font-mono text-brand bg-brand/10 px-2 py-1 rounded">"{query}"</span>
          </p>
          <p className="text-[var(--text-muted)] mt-4">
            The search engine is currently being built. In the next milestone, this page will display real commands, tools, and guides matching your query.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
