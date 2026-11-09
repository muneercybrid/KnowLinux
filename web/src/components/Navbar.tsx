import { Terminal, Menu, X, User, Settings, LogOut, LayoutDashboard } from 'lucide-react';
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsProfileOpen(false);
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
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-brand/20 border border-brand/30 text-brand font-bold uppercase hover:bg-brand/30 transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {user.name?.charAt(0) || user.email.charAt(0)}
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-3 border-b border-[var(--border-color)] mb-2">
                    <p className="text-sm font-bold truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                  </div>
                  
                  <Link to="/workspace" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-elevated)] hover:text-brand transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> Workspace
                  </Link>
                  <Link to="/account" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-elevated)] hover:text-brand transition-colors">
                    <Settings className="w-4 h-4" /> Account Settings
                  </Link>
                  
                  <div className="border-t border-[var(--border-color)] mt-2 pt-2">
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-4 space-y-4">
          {navItems.map((item) => (
            <Link key={item.name} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className="block font-semibold text-sm hover:text-brand">{item.name}</Link>
          ))}
          
          <div className="pt-4 border-t border-[var(--border-color)] flex flex-col gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-3 mb-2 px-2">
                  <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold uppercase">
                    {user.name?.charAt(0) || user.email.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{user.name || 'User'}</p>
                    <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                  </div>
                </div>
                <Link to="/workspace" onClick={() => setIsMobileMenuOpen(false)} className="text-sm hover:text-brand">Workspace</Link>
                <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="text-sm hover:text-brand">Account Settings</Link>
                <button onClick={handleLogout} className="text-left text-sm text-red-500 mt-2">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-sm hover:text-brand">Log in</Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-brand">Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

