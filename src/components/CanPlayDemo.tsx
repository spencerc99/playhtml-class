// ABOUTME: Live can-play demos wired through playhtml.register (imperative
// ABOUTME: updateElement or reactive view), isolated behind an error boundary.

import { playhtml } from 'playhtml';
import { useEffect, useRef } from 'react';
import { DemoBoundary } from './LiveHtmlDemo';

// The shipped playhtml types resolve loosely here (the snapshot's .d.ts uses
// monorepo-relative imports), so we describe the slice of the register init we
// use ourselves. This keeps the demo callbacks fully typed by their data shape.
type DataUpdater<T> = T | ((draft: T) => void);

export interface ViewContext<T, V = unknown> {
  data: T;
  setData: (next: DataUpdater<T>) => void;
  setLocalData: (next: unknown) => void;
  // The live list of every connected visitor's awareness value. Ephemeral:
  // entries appear/disappear as people join/leave, and nothing is persisted.
  awareness: V[];
  setMyAwareness: (next: V) => void;
  element: HTMLElement;
  requestUpdate: () => void;
}

// Fired whenever anyone's awareness (presence) changes, separately from data.
export interface AwarenessContext<T, V = unknown> {
  data: T;
  awareness: V[];
  myAwareness?: V;
  setData: (next: DataUpdater<T>) => void;
  setMyAwareness: (next: V) => void;
  element: HTMLElement;
}

export interface MountContext<T, V = unknown> {
  getData: () => T;
  setData: (next: DataUpdater<T>) => void;
  getAwareness: () => V[];
  setMyAwareness: (next: V) => void;
  getElement: () => HTMLElement;
  requestUpdate: () => void;
}

export interface CanPlayInit<T, V = unknown> {
  defaultData: T;
  // Per-visitor presence value. Not persisted — use for "who's here", hover
  // state, typing indicators, anything that should vanish on disconnect.
  myDefaultAwareness?: V | ((element: HTMLElement) => V);
  updateElement?: (ctx: ViewContext<T, V>) => void;
  updateElementAwareness?: (ctx: AwarenessContext<T, V>) => void;
  view?: (ctx: ViewContext<T, V>) => unknown;
  onMount?: (ctx: MountContext<T, V>) => void | (() => void);
  onClick?: (event: MouseEvent, ctx: ViewContext<T, V>) => void;
}

export interface DemoHandle<T> {
  getData: () => T;
  setData: (next: DataUpdater<T>) => void;
}

interface CanPlayDemoProps<T, V = unknown> {
  // Unique, stable id for the shared element. All visitors of the page share
  // this element's data, so keep ids distinct across demos.
  elementId: string;
  init: CanPlayInit<T, V>;
  // Optional starting markup for imperative (updateElement) demos that patch an
  // existing DOM skeleton. View demos leave this empty and render everything.
  skeleton?: string;
  styles?: string;
  // Mark this element as a cross-page/cross-site source others can subscribe to.
  // true → read-write; "read-only" → consumers can mirror but not write.
  shared?: boolean | 'read-only' | 'read-write';
  // Subscribe to a source on another page/site. Format: "domain[/path]#elementId".
  dataSource?: string;
  // Force this consumer read-only even if the source is read-write.
  dataSourceReadOnly?: boolean;
  // Runs once after the room has synced. Use for writes that must not race the
  // initial hydration (e.g. a visit counter increment), which an onMount write
  // can lose because it fires before the shared value loads.
  onReady?: (handle: DemoHandle<T>) => void;
}

export function CanPlayDemo<T, V = unknown>(props: CanPlayDemoProps<T, V>) {
  return (
    <DemoBoundary>
      <CanPlayDemoRunner {...props} />
    </DemoBoundary>
  );
}

function CanPlayDemoRunner<T, V = unknown>({
  elementId,
  init,
  skeleton = '',
  styles = '',
  shared,
  dataSource,
  dataSourceReadOnly = false,
  onReady,
}: CanPlayDemoProps<T, V>) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    // All markup here is hardcoded demo content (no user input), so innerHTML is
    // safe. View-rendered, user-typed values go through lit-html, which escapes.
    const styleTag = styles ? `<style>${styles}</style>` : '';
    // shared / data-source must be on the DOM before register/init wiring so
    // playhtml can advertise the source or subscribe the consumer.
    const sharedAttr =
      shared === true || shared === 'read-write'
        ? ' shared'
        : shared === 'read-only'
          ? ' shared="read-only"'
          : '';
    const dataSourceAttr = dataSource
      ? ` data-source="${dataSource}"`
      : '';
    const readOnlyAttr =
      dataSource && dataSourceReadOnly ? ' data-source-read-only' : '';
    container.innerHTML = `${styleTag}<div can-play id="${elementId}"${sharedAttr}${dataSourceAttr}${readOnlyAttr}>${skeleton}</div>`;

    const handle = playhtml.register(
      elementId,
      init as Parameters<typeof playhtml.register>[1],
    );

    // `playhtml.ready` resolves when the connection is up, but the element's
    // shared value can hydrate a beat later — a write fired immediately would be
    // overwritten by that incoming value. Let it settle before running onReady.
    let cancelled = false;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    if (onReady) {
      void playhtml.ready.then(() => {
        settleTimer = setTimeout(() => {
          if (!cancelled) onReady(handle as DemoHandle<T>);
        }, 700);
      });
    }

    return () => {
      cancelled = true;
      if (settleTimer) clearTimeout(settleTimer);
      handle.unregister();
      container.innerHTML = '';
    };
  }, [
    elementId,
    init,
    skeleton,
    styles,
    shared,
    dataSource,
    dataSourceReadOnly,
    onReady,
  ]);

  return <div ref={containerRef} className="live-html-demo" />;
}
