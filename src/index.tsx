// ABOUTME: Entry point that mounts the React app with PlayProvider for
// ABOUTME: collaborative state syncing via playhtml.

import App from './App';
import './App.scss';
import { PlayProvider } from '@playhtml/react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <PlayProvider
    initOptions={{
      cursors: { enabled: true },
    }}
  >
    <App />
  </PlayProvider>,
);
