import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Explore from './pages/Explore';
import SoftwarePage from './pages/Software';
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
        
        {/* Dynamic Category Explore */}
        <Route path="/explore" element={<ComingSoon />} />
        <Route path="/explore/:slug" element={<Explore />} />
        
        {/* Software Centre */}
        <Route path="/software" element={<SoftwarePage />} />
        <Route path="/software/*" element={<ComingSoon />} />
        
        {/* Other Core Modules (Placeholders for now) */}
        <Route path="/tools/*" element={<ComingSoon />} />
        <Route path="/commands/*" element={<ComingSoon />} />
        <Route path="/guides/*" element={<ComingSoon />} />
        <Route path="/fix/*" element={<ComingSoon />} />
        <Route path="/security/*" element={<ComingSoon />} />
        <Route path="/login" element={<ComingSoon />} />
        <Route path="/register" element={<ComingSoon />} />

        {/* True 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
