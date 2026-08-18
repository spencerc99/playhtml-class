// ABOUTME: Verifies class page presence snapshots become the active route set.
// ABOUTME: Malformed or missing ephemeral presence values are ignored.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { activeClassPagePaths } from './HomeBeaconOrb';

describe('activeClassPagePaths', () => {
  it('collects normalized paths from ephemeral presence', () => {
    const presences = new Map<string, Record<string, unknown>>([
      ['one', { classPage: { path: '/week/4/' } }],
      ['two', { classPage: { path: '/showcase' } }],
      ['missing', {}],
      ['malformed', { classPage: { path: 4 } }],
    ]);

    expect(activeClassPagePaths(presences)).toEqual(
      new Set(['/week/4', '/showcase']),
    );
  });

  it('does not persist or heartbeat class page activity', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/HomeBeaconOrb.tsx'),
      'utf8',
    );

    expect(source).toContain('usePresenceRoom');
    expect(source).not.toContain('setData');
    expect(source).not.toContain('withSharedState');
    expect(source).not.toContain('setInterval');
  });

  it('teaches page activity with presence instead of shared data', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/content/weeks/week-4.mdx'),
      'utf8',
    );
    const section = source.slice(
      source.indexOf('### Webring: is anyone home?'),
      source.indexOf('## Assignment / Readings'),
    );

    expect(section).toContain('createPresenceRoom');
    expect(section).not.toContain('setData');
    expect(section).not.toContain('shared can-play');
    expect(section).not.toContain('data-source=');
  });
});
