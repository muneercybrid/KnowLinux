import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Explore from './pages/Explore';
import Feature from './pages/Feature';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/explore/:slug" element={<Explore />} />
        <Route path="/:feature" element={<Feature />} />
      </Routes>
    </BrowserRouter>
  );
}
