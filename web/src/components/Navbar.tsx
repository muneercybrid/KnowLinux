import { Terminal, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Explore', path: '/explore' },
  { name: 'Software', path: '/software' },
  { name: 'Commands', path: '/commands' },
  { name: 'Guides', path: '/guides' },
  { name: 'Fix', path: '/fix' },
  { name: 'Security', path: '/security' },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-surface)]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <Terminal className="w-6 h-6 text-brand" />
          <span className="text-xl font-bold tracking-tight">KnowLinux</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <Link key={item.name} to={item.path} className="text-sm font-medium text-[var(--text-muted)] hover:text-brand transition-colors py-4 inline-block">
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/workspace" className="text-sm font-medium text-[var(--text-muted)] hover:text-brand transition-colors">Workspace</Link>
              <button onClick={handleLogout} className="text-sm font-medium text-[var(--text-muted)] hover:text-red-400 transition-colors">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-[var(--text-muted)] hover:text-brand transition-colors">Log in</Link>
              <Link to="/register" className="text-sm font-medium bg-brand hover:bg-brand-hover text-dark-bg px-4 py-2 rounded-md transition-colors font-semibold">Sign up</Link>
            </>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-4">
          <ThemeToggle />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[var(--text-muted)]">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-4 space-y-4">
          {navItems.map((item) => (
            <Link key={item.name} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className="block font-semibold text-sm hover:text-brand">{item.name}</Link>
          ))}
          <div className="pt-4 border-t border-[var(--border-color)] flex flex-col gap-2">
            {user ? (
              <>
                <Link to="/workspace" className="text-sm hover:text-brand">Workspace</Link>
                <button onClick={handleLogout} className="text-left text-sm text-red-500">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm hover:text-brand">Log in</Link>
                <Link to="/register" className="text-sm font-medium text-brand">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
