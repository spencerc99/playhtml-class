// ABOUTME: App shell with React Router and persistent nav widget.
// ABOUTME: All pages share playhtml cursors and the fixed nav.

import { useEffect, type ComponentType } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import Nav from './Nav';
import Home from './pages/Home';
import Showcase from './pages/Showcase';
import Week from './pages/Week';
import { ThreeDBenchPage } from './ThreeDBenchPage';

interface WeekContentMeta {
  title?: string;
}

interface WeekContentModule {
  default: ComponentType;
  meta?: WeekContentMeta;
}

const APP_TITLE = 'Building Benches for the Internet';

const WEEK_CONTENT = import.meta.glob<WeekContentModule>(
  './content/weeks/week-*.mdx',
  {
    eager: true,
  },
);

function DocumentTitle() {
  const location = useLocation();

  useEffect(() => {
    let pageTitle = APP_TITLE;

    if (location.pathname === '/showcase') {
      pageTitle = `Showcase | ${APP_TITLE}`;
    } else if (location.pathname === '/3d') {
      pageTitle = `3D Bench | ${APP_TITLE}`;
    } else if (location.pathname.startsWith('/week/')) {
      const weekNumber = location.pathname.split('/week/')[1];
      const weekModule = WEEK_CONTENT[`./content/weeks/week-${weekNumber}.mdx`];
      const weekTitle = weekModule?.meta?.title ?? `Week ${weekNumber}`;

      pageTitle = `${weekTitle} | ${APP_TITLE}`;
    }

    document.title = pageTitle;
  }, [location.pathname]);

  return null;
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <DocumentTitle />
      <ScrollToTop />
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/3d" element={<ThreeDBenchPage />} />
        <Route path="/showcase" element={<Showcase />} />
        <Route path="/week/:weekNumber" element={<Week />} />
      </Routes>
    </BrowserRouter>
  );
}
