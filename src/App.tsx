// ABOUTME: App shell with React Router and persistent nav widget.
// ABOUTME: All pages share playhtml cursors and the fixed nav.

import { BrowserRouter, Route, Routes } from 'react-router';
import Nav from './Nav';
import Home from './pages/Home';
import Showcase from './pages/Showcase';
import Week from './pages/Week';

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/showcase" element={<Showcase />} />
        <Route path="/week/:weekNumber" element={<Week />} />
      </Routes>
    </BrowserRouter>
  );
}
