import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Terminal, Copy, Check, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Command {
  id: number;
  name: string;
  slug: string;
  description: string;
  parameters: string; // JSON string
}

interface Parameter {
  name: string;
  label: string;
  type: 'text' | 'select' | 'boolean';
  placeholder?: string;
  options?: string[];
  required: boolean;
  flag: string;
}

export default function CommandGenerator() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  const [generatedCmd, setGeneratedCmd] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/commands')
      .then(res => res.json())
      .then(data => setCommands(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedCommand) return;
    try {
      const parsedParams: Parameter[] = JSON.parse(selectedCommand.parameters);
      const initialParams: Record<string, any> = {};
      parsedParams.forEach(p => {
        initialParams[p.name] = p.type === 'boolean' ? false : '';
      });
      setParams(initialParams);
    } catch (e) {
      console.error("Failed to parse parameters", e);
    }
  }, [selectedCommand]);

  // Generate the command string dynamically
  useEffect(() => {
    if (!selectedCommand) return;
    try {
      const parsedParams: Parameter[] = JSON.parse(selectedCommand.parameters);
      let cmd = selectedCommand.name;
      
      // Add flags
      parsedParams.forEach(p => {
        if (p.type === 'boolean' && params[p.name]) {
          cmd += ` ${p.flag}`;
        } else if (p.type === 'select' && params[p.name]) {
          // Extract just the flag part (e.g., "-sS" from "-sS (SYN Scan)")
          cmd += ` ${params[p.name].split(' ')[0]}`;
        }
      });

      // Add positional arguments at the end
      parsedParams.forEach(p => {
        if ((p.type === 'text') && params[p.name]) {
          cmd += ` ${params[p.name]}`;
        }
      });

      setGeneratedCmd(cmd);
    } catch (e) {
      console.error(e);
    }
  }, [params, selectedCommand]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeParams: Parameter[] = selectedCommand ? JSON.parse(selectedCommand.parameters) : [];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <Link to="/commands" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Command Studio
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Terminal className="w-8 h-8 text-brand" /> Command Generator
          </h1>
          <p className="text-[var(--text-muted)]">Select a command and fill in the parameters to generate a safe, accurate command.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar: Command List */}
          <div className="col-span-1 border border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)] overflow-hidden">
            <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-color)] font-semibold">
              Available Commands
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {commands.map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => setSelectedCommand(cmd)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--border-color)] hover:bg-[var(--bg-elevated)] transition-colors font-mono ${selectedCommand?.id === cmd.id ? 'bg-brand/10 text-brand border-l-2 border-l-brand' : 'text-[var(--text-main)]'}`}
                >
                  {cmd.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Area: Form & Output */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            {!selectedCommand ? (
              <div className="h-full flex items-center justify-center p-12 border border-dashed border-[var(--border-color)] rounded-xl text-[var(--text-muted)]">
                Select a command from the list to begin.
              </div>
            ) : (
              <>
                <div className="p-6 border border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)] space-y-4">
                  <h2 className="text-xl font-bold font-mono text-brand">{selectedCommand.name}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{selectedCommand.description}</p>

                  {activeParams.length === 0 ? (
                    <div className="p-4 bg-amber-500/10 text-amber-500 rounded-lg text-sm">
                      This command does not have a generator form yet. You can view examples in the <Link to={`/commands/${selectedCommand.slug}`} className="underline">detail page</Link>.
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4">
                      {activeParams.map(p => (
                        <div key={p.name}>
                          <label className="block text-sm font-medium mb-1">{p.label}</label>
                          {p.type === 'text' && (
                            <input
                              type="text"
                              placeholder={p.placeholder}
                              value={params[p.name] || ''}
                              onChange={e => setParams({...params, [p.name]: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                            />
                          )}
                          {p.type === 'select' && p.options && (
                            <select
                              value={params[p.name] || ''}
                              onChange={e => setParams({...params, [p.name]: e.target.value})}
                              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                            >
                              <option value="">Default</option>
                              {p.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          )}
                          {p.type === 'boolean' && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={params[p.name] || false}
                                onChange={e => setParams({...params, [p.name]: e.target.checked})}
                                className="w-4 h-4 rounded border-[var(--border-color)] text-brand focus:ring-brand bg-[var(--bg-elevated)]"
                              />
                              <span className="text-sm text-[var(--text-muted)]">Enable</span>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generated Command Output */}
                {activeParams.length > 0 && (
                  <div className="border border-[var(--border-color)] rounded-xl overflow-hidden bg-[#0d1117]">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
                      <div className="text-xs font-mono text-[var(--text-muted)]">Generated Command</div>
                      <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-brand transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-4">
                      <pre className="font-mono text-lg text-emerald-400"><code>$ {generatedCmd || selectedCommand.name}</code></pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
