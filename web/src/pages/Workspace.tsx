import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Workspace() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Your Workspace</h1>
        <p className="text-[var(--text-muted)] mb-8">Welcome back, {user?.name || user?.email}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/commands" className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand transition-colors">
            <h2 className="text-xl font-bold mb-2">Browse Commands</h2>
            <p className="text-[var(--text-muted)]">Explore the Command Studio to find and save useful commands.</p>
          </Link>
          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] opacity-50">
            <h2 className="text-xl font-bold mb-2">Saved Commands</h2>
            <p className="text-[var(--text-muted)]">Coming soon: your saved commands will appear here.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
