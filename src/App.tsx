// ABOUTME: App shell with React Router and persistent nav widget.
// ABOUTME: All pages share playhtml cursors and the fixed nav.

import { useEffect, type ComponentType } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { ClassWebringEmbed } from './components/ClassWebringEmbed';
import Nav from './Nav';
import Home from './pages/Home';
import Playground from './pages/Playground';
import Showcase from './pages/Showcase';
import WebringDemo from './pages/WebringDemo';
import Week from './pages/Week';
import { ThreeDBenchPage } from './ThreeDBenchPage';

interface WeekContentMeta {
  title?: string;
}

interface WeekContentModule {
  default: ComponentType;
  meta?: WeekContentMeta;
}

const APP_TITLE = 'Building Benches for the Web';

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
    } else if (location.pathname === '/playground') {
      pageTitle = APP_TITLE;
    } else if (location.pathname === '/webring-demo') {
      pageTitle = `Web Ring Embed Demo | ${APP_TITLE}`;
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
  const location = useLocation();
  const isPlayground = location.pathname === '/playground';

  return (
    <>
      <DocumentTitle />
      <ScrollToTop />
      {isPlayground ? null : <Nav />}
      <ClassWebringEmbed />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/3d" element={<ThreeDBenchPage />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/showcase" element={<Showcase />} />
        <Route path="/webring-demo" element={<WebringDemo />} />
        <Route path="/week/:weekNumber" element={<Week />} />
      </Routes>
    </>
  );
}
