import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Terminal } from 'lucide-react';

export default function Explore() {
  const { slug } = useParams();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-12">
        <Link to="/" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <Terminal className="w-8 h-8 text-brand" />
          <h1 className="text-3xl font-bold capitalize">Explore: {slug?.replace('-', ' ')}</h1>
        </div>
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl">
          <p className="text-[var(--text-muted)]">
            This category page is under construction. Soon, you will see a list of tools, commands, and guides related to {slug?.replace('-', ' ')}.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
