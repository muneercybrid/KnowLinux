import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Account() {
  const { user } = useAuth();

  if (!user) return null; // Protected route handles this, but just in case

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
        <Link to="/workspace" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-brand mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspace
        </Link>
        
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center text-brand text-2xl font-bold uppercase">
                {user.name?.charAt(0) || user.email.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.name || 'User'}</h2>
                <p className="text-[var(--text-muted)]">Free Member</p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-5 h-5 text-[var(--text-faint)]" />
                <div>
                  <p className="font-medium text-[var(--text-main)]">Display Name</p>
                  <p className="text-[var(--text-muted)]">{user.name || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-[var(--text-faint)]" />
                <div>
                  <p className="font-medium text-[var(--text-main)]">Email Address</p>
                  <p className="text-[var(--text-muted)]">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-[var(--text-faint)]" />
                <div>
                  <p className="font-medium text-[var(--text-main)]">Account Security</p>
                  <p className="text-[var(--text-muted)]">Password protected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/5">
            <h3 className="text-lg font-bold text-red-500 mb-2">Danger Zone</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
