import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Search from './pages/Search';
import Explore from './pages/Explore';
import SoftwarePage from './pages/Software';
import SoftwareDetail from './pages/SoftwareDetail';
import CommandsPage from './pages/Commands';
import CommandDetail from './pages/CommandDetail';
import CommandGenerator from './pages/CommandGenerator';
import Login from './pages/Login';
import Register from './pages/Register';
import Workspace from './pages/Workspace';
import Account from './pages/Account';
import ComingSoon from './pages/ComingSoon';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-[var(--text-muted)] mb-6">Page not found</p>
      <Link to="/" className="text-brand hover:underline">Go back home</Link>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          
          <Route path="/explore" element={<ComingSoon />} />
          <Route path="/explore/:slug" element={<Explore />} />
          
          <Route path="/software" element={<SoftwarePage />} />
          <Route path="/software/:slug" element={<SoftwareDetail />} />
          
          <Route path="/commands" element={<CommandsPage />} />
          <Route path="/commands/generate" element={<CommandGenerator />} />
          <Route path="/commands/:slug" element={<CommandDetail />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/workspace" element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          } />
          <Route path="/account" element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          } />

          <Route path="/tools/*" element={<ComingSoon />} />
          <Route path="/guides/*" element={<ComingSoon />} />
          <Route path="/fix/*" element={<ComingSoon />} />
          <Route path="/security/*" element={<ComingSoon />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
