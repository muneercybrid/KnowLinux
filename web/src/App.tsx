import { Search, Terminal, Shield, BookOpen, Wrench, AlertTriangle, ArrowRight, Box, Code, Server, Database, HardDrive, Network, Lock, Cpu } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

const categories = [
  { name: 'Linux Fundamentals', icon: Terminal, desc: 'Core concepts, filesystem, and shell basics.' },
  { name: 'System Administration', icon: Server, desc: 'Manage users, services, and processes.' },
  { name: 'Package Management', icon: Box, desc: 'APT, DNF, Pacman, and software repositories.' },
  { name: 'Networking', icon: Network, desc: 'Network configuration, DNS, and diagnostics.' },
  { name: 'Development', icon: Code, desc: 'Compilers, version control, and environments.' },
  { name: 'Cybersecurity', icon: Shield, desc: 'Hardening, defensive security, and testing.' },
  { name: 'Digital Forensics', icon: Lock, desc: 'Evidence acquisition and system analysis.' },
  { name: 'Troubleshooting', icon: AlertTriangle, desc: 'Resolve errors, dependency conflicts, and boot issues.' },
  { name: 'Desktop Linux', icon: Cpu, desc: 'GUI, drivers, and desktop environments.' },
  { name: 'Storage & Filesystems', icon: HardDrive, desc: 'Partitioning, LVM, and file system management.' },
  { name: 'Databases', icon: Database, desc: 'PostgreSQL, MySQL, and database administration.' },
  { name: 'Automation', icon: Wrench, desc: 'Bash scripting, cron jobs, and Ansible.' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand/10 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-block px-3 py-1 rounded-full border border-brand/30 bg-brand/10 text-brand text-xs font-semibold tracking-wider uppercase mb-4">
              The Linux Knowledge and Productivity Platform
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Understand Linux.<br />
              <span className="text-brand">Master the Terminal.</span><br />
              Secure the Digital World.
            </h1>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              Learn Linux, discover software, generate commands, solve system problems, and develop practical technical skills across distributions.
            </p>
            
            <div className="relative max-w-2xl mx-auto group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-faint)] group-focus-within:text-brand transition-colors" />
              <input 
                type="text" 
                placeholder="Search commands, software, Linux errors, tools, and guides..." 
                className="w-full pl-12 pr-16 py-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-lg text-[var(--text-main)] placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent shadow-sm transition-all"
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono bg-[var(--bg-elevated)] text-[var(--text-faint)] px-2 py-1 rounded border border-[var(--border-color)]">Ctrl K</kbd>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <span>Suggested:</span>
              {['Install Docker on Kali', 'Configure SSH on Ubuntu', 'Fix APT repository errors', 'Find listening ports'].map(term => (
                <button key={term} className="px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-brand hover:text-brand transition-colors">
                  {term}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Capabilities */}
        <section className="py-16 px-4 bg-[var(--bg-surface)] border-y border-[var(--border-color)]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Core Platform</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Command Studio', desc: 'Generate and understand Linux commands for your environment.', icon: Terminal, action: 'Explore Commands' },
                { title: 'Software Centre', desc: 'Find software and get complete installation instructions for your distro.', icon: Box, action: 'Explore Software' },
                { title: 'KnowLinux Fix', desc: 'Understand Linux errors and find safe troubleshooting procedures.', icon: AlertTriangle, action: 'Diagnose a Problem' },
                { title: 'Linux Guides', desc: 'Learn Linux through structured, practical tutorials.', icon: BookOpen, action: 'Browse Guides' },
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-brand transition-colors group cursor-pointer flex flex-col h-full">
                  <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] flex-grow mb-6">{feature.desc}</p>
                  <div className="flex items-center text-brand text-sm font-medium">
                    {feature.action} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Explore Categories */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Explore Linux</h2>
              <a href="#" className="text-sm font-medium text-brand hover:underline">View all categories</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-brand hover:shadow-sm transition-all cursor-pointer group">
                  <div className="p-2 rounded-md bg-[var(--bg-elevated)] group-hover:bg-brand/10 transition-colors">
                    <cat.icon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-brand transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-brand transition-colors">{cat.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{cat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
