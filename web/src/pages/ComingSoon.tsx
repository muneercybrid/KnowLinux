import { useLocation, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Construction, Terminal } from 'lucide-react';

export default function ComingSoon() {
  const location = useLocation();
  // Formats the URL path into a readable title (e.g., "/software/package-managers" -> "Software Package Managers")
  const pageTitle = location.pathname
    .split('/')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).replace(/-/g, ' '))
    .join(' / ') || 'Module';

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-8">
          <Construction className="w-10 h-10 text-brand" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4">{pageTitle}</h1>
        <p className="text-lg text-[var(--text-muted)] mb-8 max-w-xl">
          We are currently building this module. Check back soon for comprehensive Linux tools, commands, and guides.
        </p>
        <div className="flex gap-4">
          <Link to="/" className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-dark-bg px-6 py-3 rounded-lg font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <Link to="/software" className="flex items-center gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-main)] px-6 py-3 rounded-lg font-semibold transition-colors">
            <Terminal className="w-4 h-4" /> View Software Centre
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
