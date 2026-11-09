import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Explore from './pages/Explore';
import SoftwarePage from './pages/Software';
import SoftwareDetail from './pages/SoftwareDetail';
import CommandsPage from './pages/Commands';
import CommandDetail from './pages/CommandDetail';
import CommandGenerator from './pages/CommandGenerator';
import ComingSoon from './pages/ComingSoon';

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

        <Route path="/tools/*" element={<ComingSoon />} />
        <Route path="/guides/*" element={<ComingSoon />} />
        <Route path="/fix/*" element={<ComingSoon />} />
        <Route path="/security/*" element={<ComingSoon />} />
        <Route path="/login" element={<ComingSoon />} />
        <Route path="/register" element={<ComingSoon />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
