// ABOUTME: Per-page home beacon — each class route publishes its own shared
// ABOUTME: pulse with a unique element id so the webring can mirror many at once.

import { withSharedState } from '@playhtml/react';
import { playhtml } from 'playhtml';
import { useEffect, useState, type CSSProperties, type RefObject } from 'react';
import { useLocation } from 'react-router';

/** How long after the last pulse a page still counts as "someone is here". */
export const HOME_MS = 10_000;
const PULSE_MS = 4_000;
/** All beacon consumers poll at this interval so glow turns off without new sync. */
export const BEACON_FRESHNESS_POLL_MS = 1_000;

export interface HomeBeaconData {
  lastSeen: number;
}

interface OrbPlacement {
  top: string;
  left: string;
}

export function isHomeBeaconLive(
  lastSeen: number,
  now: number = Date.now(),
): boolean {
  return lastSeen > 0 && now - lastSeen < HOME_MS;
}

/** Stable unique id per class route — required because playhtml keys data-source
 *  consumers by the #fragment, not the full host/path. */
export function pageBeaconIdForPath(pathname: string): string {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/') return 'page-beacon-home';
  const week = path.match(/^\/week\/(\d+)$/);
  if (week) return `page-beacon-week-${week[1]}`;
  if (path === '/showcase') return 'page-beacon-showcase';
  return `page-beacon-${path.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')}`;
}

/** data-source for a page's beacon. Must match playhtml shared-source paths:
 *  `/` → `host/#id`; `/week/4` → `host/week/4#id`. */
export function pageHomeBeaconDataSource(pathname: string): string {
  const host = window.location.host;
  const path = pathname.replace(/\/$/, '') || '/';
  const id = pageBeaconIdForPath(pathname);
  return `${host}${path}#${id}`;
}

function pickPlacement(): OrbPlacement {
  const pockets: OrbPlacement[] = [
    { top: '8%', left: '12%' },
    { top: '18%', left: '78%' },
    { top: '42%', left: '-6%' },
    { top: '55%', left: '92%' },
    { top: '72%', left: '8%' },
    { top: '4%', left: '58%' },
    { top: '88%', left: '70%' },
    { top: '35%', left: '105%' },
  ];
  const base = pockets[Math.floor(Math.random() * pockets.length)]!;
  const jitterX = (Math.random() - 0.5) * 8;
  const jitterY = (Math.random() - 0.5) * 6;
  return {
    top: `calc(${base.top} + ${jitterY}%)`,
    left: `calc(${base.left} + ${jitterX}%)`,
  };
}

interface ClassHomeBeaconOrbProps {
  // Defaults to the current route via useLocation when omitted.
  pathname?: string;
}

const ClassHomeBeaconOrbShared = withSharedState<
  HomeBeaconData,
  never,
  { pathname: string }
>(
  ({ pathname }) => ({
    defaultData: { lastSeen: 0 },
    id: pageBeaconIdForPath(pathname),
    shared: 'read-write',
    onMount: ({ setData }) => {
      let cancelled = false;
      let pulseId: ReturnType<typeof setInterval> | undefined;
      let settleTimer: ReturnType<typeof setTimeout> | undefined;

      void playhtml.ready.then(() => {
        settleTimer = setTimeout(() => {
          if (cancelled) return;
          const pulse = () => {
            setData((draft) => {
              draft.lastSeen = Date.now();
            });
          };
          pulse();
          pulseId = setInterval(pulse, PULSE_MS);
        }, 700);
      });

      return () => {
        cancelled = true;
        if (settleTimer) clearTimeout(settleTimer);
        if (pulseId) clearInterval(pulseId);
      };
    },
  }),
  ({ data, ref }, { pathname }) => {
    const [now, setNow] = useState(() => Date.now());
    const [placement] = useState(pickPlacement);
    const beaconId = pageBeaconIdForPath(pathname);

    useEffect(() => {
      const id = window.setInterval(
        () => setNow(Date.now()),
        BEACON_FRESHNESS_POLL_MS,
      );
      return () => clearInterval(id);
    }, []);

    const home = isHomeBeaconLive(data.lastSeen, now);
    const style = {
      '--orb-top': placement.top,
      '--orb-left': placement.left,
    } as CSSProperties;

    return (
      <span
        ref={ref as RefObject<HTMLSpanElement>}
        id={beaconId}
        className={`home-beacon-orb${home ? ' is-home' : ''}`}
        style={style}
        title={home ? 'someone is on this page right now' : 'this page is quiet'}
        aria-hidden="true"
      />
    );
  },
);

export function ClassHomeBeaconOrb(props: ClassHomeBeaconOrbProps) {
  const location = useLocation();
  const pathname = props.pathname ?? location.pathname;
  return <ClassHomeBeaconOrbShared pathname={pathname} />;
}

/** @deprecated Prefer ClassHomeBeaconOrb */
export const HomeBeaconOrb = ClassHomeBeaconOrb;
