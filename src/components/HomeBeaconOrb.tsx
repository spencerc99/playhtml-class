// ABOUTME: Class page presence publisher that pulses each active route into the
// ABOUTME: shared Week 4 registry and renders the route's title beacon.

import { withSharedState } from '@playhtml/react';
import { playhtml } from 'playhtml';
import { useEffect, useState, type CSSProperties, type RefObject } from 'react';
import { useLocation } from 'react-router';

/** How long after the last pulse a page still counts as "someone is here". */
export const HOME_MS = 10_000;
const PULSE_MS = 4_000;
/** Consumers poll so glow turns off without a new sync event. */
export const BEACON_FRESHNESS_POLL_MS = 1_000;

/** Shared element on /week/4 — other pages write via data-source. */
export const CLASS_PAGE_PRESENCE_ID = 'class-page-presence';
export const CLASS_PAGE_PRESENCE_PATH = '/week/4';

export interface ClassPagePresenceData {
  byPath: Record<string, number>;
}

interface OrbPlacement {
  top: string;
  left: string;
}

export function normalizePath(pathname: string): string {
  return pathname.replace(/\/$/, '') || '/';
}

export function isHomeBeaconLive(
  lastSeen: number,
  now: number = Date.now(),
): boolean {
  return lastSeen > 0 && now - lastSeen < HOME_MS;
}

export function presenceLastSeen(
  data: ClassPagePresenceData | null | undefined,
  pathname: string,
): number {
  return data?.byPath?.[normalizePath(pathname)] ?? 0;
}

/** data-source pointing at the week-4 presence registry. */
export function classPagePresenceDataSource(): string {
  return `${window.location.host}${CLASS_PAGE_PRESENCE_PATH}#${CLASS_PAGE_PRESENCE_ID}`;
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

type PresenceDataUpdater = (fn: (draft: ClassPagePresenceData) => void) => void;

function pulsePath(setData: PresenceDataUpdater, pathname: string) {
  const path = normalizePath(pathname);
  setData((draft) => {
    draft.byPath ??= {};
    draft.byPath[path] = Date.now();
  });
}

export function startClassPagePresenceHeartbeat(
  setData: PresenceDataUpdater,
  getElement: () => HTMLElement,
  pathname: string,
): () => void {
  let cancelled = false;
  let pulseId: ReturnType<typeof setInterval> | undefined;
  let readinessTimer: ReturnType<typeof setTimeout> | undefined;

  void playhtml.ready.then(() => {
    const start = () => {
      if (cancelled) return;
      if (getElement().getAttribute('aria-busy') === 'true') {
        readinessTimer = setTimeout(start, 100);
        return;
      }

      const pulse = () => pulsePath(setData, pathname);
      pulse();
      pulseId = setInterval(pulse, PULSE_MS);
    };

    start();
  });

  return () => {
    cancelled = true;
    if (readinessTimer) clearTimeout(readinessTimer);
    if (pulseId) clearInterval(pulseId);
  };
}

interface ClassHomeBeaconOrbProps {
  pathname?: string;
}

const ClassHomeBeaconOrbShared = withSharedState<
  ClassPagePresenceData,
  never,
  { pathname: string }
>(
  ({ pathname }) => ({
    defaultData: { byPath: {} },
    id: CLASS_PAGE_PRESENCE_ID,
    dataSource: classPagePresenceDataSource(),
    onMount: ({ setData, getElement }) =>
      startClassPagePresenceHeartbeat(setData, getElement, pathname),
  }),
  ({ data, ref }, { pathname }) => {
    const [now, setNow] = useState(() => Date.now());
    const [placement] = useState(pickPlacement);

    useEffect(() => {
      let cancelled = false;

      void playhtml.handleNavigation().then(() => {
        const element = ref.current;
        if (cancelled || !element) return;

        playhtml.removePlayElement(element);
        playhtml.setupPlayElement(element);
      });

      return () => {
        cancelled = true;
      };
    }, [pathname, ref]);

    useEffect(() => {
      const id = window.setInterval(
        () => setNow(Date.now()),
        BEACON_FRESHNESS_POLL_MS,
      );
      return () => clearInterval(id);
    }, []);

    const home = isHomeBeaconLive(presenceLastSeen(data, pathname), now);
    const style = {
      '--orb-top': placement.top,
      '--orb-left': placement.left,
    } as CSSProperties;

    return (
      <span
        ref={ref as RefObject<HTMLSpanElement>}
        className={`home-beacon-orb${home ? ' is-home' : ''}`}
        style={style}
        title={
          home ? 'someone is on this page right now' : 'this page is quiet'
        }
        aria-hidden="true"
      />
    );
  },
);

export function ClassHomeBeaconOrb(props: ClassHomeBeaconOrbProps) {
  const location = useLocation();
  const pathname = normalizePath(props.pathname ?? location.pathname);

  if (pathname === CLASS_PAGE_PRESENCE_PATH) {
    const placement = pickPlacement();
    const style = {
      '--orb-top': placement.top,
      '--orb-left': placement.left,
    } as CSSProperties;

    return (
      <span
        className="home-beacon-orb is-home"
        style={style}
        title="someone is on this page right now"
        aria-hidden="true"
      />
    );
  }

  return <ClassHomeBeaconOrbShared key={pathname} pathname={pathname} />;
}

/** @deprecated Prefer ClassHomeBeaconOrb */
export const HomeBeaconOrb = ClassHomeBeaconOrb;
