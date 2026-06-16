// ABOUTME: Checks page navigation links that students use to move through
// ABOUTME: class content and instructor resources.

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, test } from 'vitest';
import Home from './Home';
import Week from './Week';

describe('page navigation links', () => {
  test('week detail pages link back to the home page', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/week/1']}>
        <Routes>
          <Route path="/week/:weekNumber" element={<Week />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(markup).toContain('href="/"');
    expect(markup).toContain('Home');
    expect(markup).toContain('href="https://spencer.place"');
    expect(markup).toContain('href="https://www.munusshih.com/"');
  });

  test('home page links instructor names to their websites', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(markup).toContain('href="https://spencer.place"');
    expect(markup).toContain('href="https://www.munusshih.com/"');
  });
});
