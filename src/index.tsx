// ABOUTME: Entry point that mounts the React app with PlayProvider for
// ABOUTME: collaborative state syncing via playhtml.

import App from './App';
import 'highlight.js/styles/github.css';
import './App.scss';
import { PlayProvider } from '@playhtml/react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router';

// Feeds the current pathname to PlayProvider so it reconnects to the per-page
// room on client-side navigation (PlayProvider calls handleNavigation when its
// pathname prop changes). Must live inside the router to read useLocation.
function PlayWithLocation() {
  const { pathname } = useLocation();
  const isPlaygroundFrame = pathname === '/playground';

  return (
    <PlayProvider
      initOptions={{
        // The playground is normally an iframe. It still syncs shared objects,
        // but skips a redundant presence socket and uses PlayHTML's stable
        // presence identity for editor ownership instead.
        cursors: { enabled: !isPlaygroundFrame },
      }}
      pathname={pathname}
    >
      <App />
    </PlayProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <PlayWithLocation />
  </BrowserRouter>,
);
