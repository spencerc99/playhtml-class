// ABOUTME: Checks page navigation links that students use to move through
// ABOUTME: class content and instructor resources.

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Home from './Home';
import Week from './Week';

function renderWeekDetail(path: string) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/week/:weekNumber" element={<Week />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('page navigation links', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('week detail pages link back to the home page', () => {
    const markup = renderWeekDetail('/week/1');

    expect(markup).toContain('href="/"');
    expect(markup).toContain('Home');
    expect(markup).toContain('href="https://spencer.place"');
    expect(markup).toContain('href="https://www.munusshih.com/"');
  });

  test('week detail pages hide next week links until they unlock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-16T12:00:00'));

    const markup = renderWeekDetail('/week/0');

    expect(markup).not.toContain('href="/week/1"');
    expect(markup).not.toContain('Next Week');
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

  test('home page week links do not change row spacing on hover', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(markup).not.toContain('hover:px-');
  });
});
