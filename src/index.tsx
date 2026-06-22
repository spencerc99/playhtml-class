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

  return (
    <PlayProvider
      initOptions={{
        cursors: { enabled: true },
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
