// ABOUTME: Publishes each active class route through ephemeral presence.
// ABOUTME: Renders a title beacon without adding persistent room history.

import { usePresenceRoom } from '@playhtml/react';
import { useEffect, useState, type CSSProperties } from 'react';
import { useLocation } from 'react-router';

const CLASS_PAGE_PRESENCE_ROOM = 'class-page-presence';
const CLASS_PAGE_PRESENCE_CHANNEL = 'classPage';
export const CLASS_PAGE_PRESENCE_PATH = '/week/4';

interface OrbPlacement {
  top: string;
  left: string;
}

interface ClassPagePresenceValue {
  path: string;
}

export function normalizePath(pathname: string): string {
  return pathname.replace(/\/$/, '') || '/';
}

export function activeClassPagePaths(
  presences: ReadonlyMap<string, Record<string, unknown>>,
): Set<string> {
  const paths = new Set<string>();

  for (const presence of presences.values()) {
    const value = presence[CLASS_PAGE_PRESENCE_CHANNEL];
    if (
      typeof value === 'object' &&
      value !== null &&
      'path' in value &&
      typeof value.path === 'string'
    ) {
      paths.add(normalizePath(value.path));
    }
  }

  return paths;
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

export function useClassPagePresence(pathname: string): Set<string> {
  const room = usePresenceRoom(CLASS_PAGE_PRESENCE_ROOM);
  const [activePaths, setActivePaths] = useState<Set<string>>(new Set());
  const path = normalizePath(pathname);

  useEffect(() => {
    if (!room) {
      setActivePaths(new Set());
      return;
    }

    const updatePaths = (presences: Map<string, Record<string, unknown>>) => {
      setActivePaths(activeClassPagePaths(presences));
    };

    const value: ClassPagePresenceValue = { path };
    room.presence.setMyPresence(CLASS_PAGE_PRESENCE_CHANNEL, value);
    const unsubscribe = room.presence.onPresenceChange(
      CLASS_PAGE_PRESENCE_CHANNEL,
      updatePaths,
    );

    return () => {
      unsubscribe();
      room.presence.setMyPresence(CLASS_PAGE_PRESENCE_CHANNEL, null);
    };
  }, [path, room]);

  return activePaths;
}

interface ClassHomeBeaconOrbProps {
  pathname?: string;
}

function ConnectedHomeBeaconOrb({
  pathname,
  placement,
}: {
  pathname: string;
  placement: OrbPlacement;
}) {
  const activePaths = useClassPagePresence(pathname);
  const home = activePaths.has(pathname);
  const style = {
    '--orb-top': placement.top,
    '--orb-left': placement.left,
  } as CSSProperties;

  return (
    <span
      className={`home-beacon-orb${home ? ' is-home' : ''}`}
      style={style}
      title={home ? 'someone is on this page right now' : 'this page is quiet'}
      aria-hidden="true"
    />
  );
}

export function ClassHomeBeaconOrb(props: ClassHomeBeaconOrbProps) {
  const location = useLocation();
  const pathname = normalizePath(props.pathname ?? location.pathname);
  const [placement] = useState(pickPlacement);

  if (pathname === CLASS_PAGE_PRESENCE_PATH) {
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

  return <ConnectedHomeBeaconOrb pathname={pathname} placement={placement} />;
}

/** @deprecated Prefer ClassHomeBeaconOrb */
export const HomeBeaconOrb = ClassHomeBeaconOrb;
