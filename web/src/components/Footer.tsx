export function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-surface)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-[var(--text-main)]">Product</h3>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><a href="#" className="hover:text-brand">About KnowLinux</a></li>
              <li><a href="#" className="hover:text-brand">Explore</a></li>
              <li><a href="#" className="hover:text-brand">Tools</a></li>
              <li><a href="#" className="hover:text-brand">Commands</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-[var(--text-main)]">Learning</h3>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><a href="#" className="hover:text-brand">Linux Fundamentals</a></li>
              <li><a href="#" className="hover:text-brand">Tutorials</a></li>
              <li><a href="#" className="hover:text-brand">Learning Paths</a></li>
              <li><a href="#" className="hover:text-brand">Troubleshooting</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-[var(--text-main)]">Resources</h3>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><a href="#" className="hover:text-brand">Documentation</a></li>
              <li><a href="#" className="hover:text-brand">Supported Distributions</a></li>
              <li><a href="#" className="hover:text-brand">Sources</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-[var(--text-main)]">Legal</h3>
            <ul className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><a href="#" className="hover:text-brand">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand">Terms of Service</a></li>
              <li><a href="#" className="hover:text-brand">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between text-xs text-[var(--text-faint)]">
          <p>&copy; {new Date().getFullYear()} KnowLinux. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
