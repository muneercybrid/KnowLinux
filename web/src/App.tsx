import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Explore from './pages/Explore';
import Feature from './pages/Feature';
import SoftwarePage from './pages/Software';

// A simple 404 component for unmatched routes
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
        <Route path="/explore/:slug" element={<Explore />} />
        <Route path="/software" element={<SoftwarePage />} />
        
        {/* Explicit routes for other core features */}
        <Route path="/commands" element={<Feature />} />
        <Route path="/fix" element={<Feature />} />
        <Route path="/guides" element={<Feature />} />

        {/* Catch-all for 404s */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
