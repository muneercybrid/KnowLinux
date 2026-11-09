import { Terminal, Search, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';

const navItems = [
  { name: 'Explore', dropdown: ['Linux Fundamentals', 'Distributions', 'Desktop Linux', 'Networking'] },
  { name: 'Tools', dropdown: ['System Utilities', 'Networking Tools', 'Security Tools', 'Monitoring'] },
  { name: 'Commands', dropdown: ['Command Explorer', 'Command Generator', 'Shell Scripting'] },
  { name: 'Software', dropdown: ['Software Discovery', 'Install Software', 'Package Managers'] },
  { name: 'Guides', dropdown: ['Beginner', 'Intermediate', 'Advanced', 'Tutorials'] },
  { name: 'Fix', dropdown: ['Diagnose an Error', 'Package Installation', 'Boot Problems'] },
  { name: 'Security', dropdown: ['Linux Hardening', 'Penetration Testing', 'Incident Response'] },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-surface)]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <Terminal className="w-6 h-6 text-brand" />
          <span className="text-xl font-bold tracking-tight">KnowLinux</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <div key={item.name} className="relative group">
              <button className="text-sm font-medium text-[var(--text-muted)] hover:text-brand transition-colors py-4">
                {item.name}
              </button>
              {/* Dropdown */}
              <div className="absolute top-full left-0 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-xl py-2 z-50">
                {item.dropdown.map((sub) => (
                  <a key={sub} href="#" className="block px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-brand">
                    {sub}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-faint)] text-sm hover:border-brand transition-colors">
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="ml-4 text-xs font-mono bg-[var(--bg-main)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">Ctrl K</kbd>
          </button>
          <ThemeToggle />
          <a href="#" className="text-sm font-medium text-[var(--text-muted)] hover:text-brand transition-colors">Log in</a>
          <a href="#" className="text-sm font-medium bg-brand hover:bg-brand-hover text-dark-bg px-4 py-2 rounded-md transition-colors font-semibold">Sign up</a>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-4">
          <ThemeToggle />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[var(--text-muted)]">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-4 space-y-4">
          {navItems.map((item) => (
            <div key={item.name}>
              <div className="font-semibold text-sm mb-1">{item.name}</div>
              <div className="grid grid-cols-2 gap-2">
                {item.dropdown.map(sub => (
                  <a key={sub} href="#" className="text-sm text-[var(--text-muted)] hover:text-brand">{sub}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
