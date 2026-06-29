// ABOUTME: Live can-play demos wired through playhtml.register (imperative
// ABOUTME: updateElement or reactive view), isolated behind an error boundary.

import { playhtml } from 'playhtml';
import { useEffect, useRef } from 'react';
import { DemoBoundary } from './LiveHtmlDemo';

// The shipped playhtml types resolve loosely here (the snapshot's .d.ts uses
// monorepo-relative imports), so we describe the slice of the register init we
// use ourselves. This keeps the demo callbacks fully typed by their data shape.
type DataUpdater<T> = T | ((draft: T) => void);

export interface ViewContext<T> {
  data: T;
  setData: (next: DataUpdater<T>) => void;
  setLocalData: (next: unknown) => void;
  element: HTMLElement;
  requestUpdate: () => void;
}

export interface MountContext<T> {
  getData: () => T;
  setData: (next: DataUpdater<T>) => void;
  getElement: () => HTMLElement;
  requestUpdate: () => void;
}

export interface CanPlayInit<T> {
  defaultData: T;
  updateElement?: (ctx: ViewContext<T>) => void;
  view?: (ctx: ViewContext<T>) => unknown;
  onMount?: (ctx: MountContext<T>) => void | (() => void);
  onClick?: (event: MouseEvent, ctx: ViewContext<T>) => void;
}

export interface DemoHandle<T> {
  getData: () => T;
  setData: (next: DataUpdater<T>) => void;
}

interface CanPlayDemoProps<T> {
  // Unique, stable id for the shared element. All visitors of the page share
  // this element's data, so keep ids distinct across demos.
  elementId: string;
  init: CanPlayInit<T>;
  // Optional starting markup for imperative (updateElement) demos that patch an
  // existing DOM skeleton. View demos leave this empty and render everything.
  skeleton?: string;
  styles?: string;
  // Runs once after the room has synced. Use for writes that must not race the
  // initial hydration (e.g. a visit counter increment), which an onMount write
  // can lose because it fires before the shared value loads.
  onReady?: (handle: DemoHandle<T>) => void;
}

export function CanPlayDemo<T>(props: CanPlayDemoProps<T>) {
  return (
    <DemoBoundary>
      <CanPlayDemoRunner {...props} />
    </DemoBoundary>
  );
}

function CanPlayDemoRunner<T>({
  elementId,
  init,
  skeleton = '',
  styles = '',
  onReady,
}: CanPlayDemoProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    // All markup here is hardcoded demo content (no user input), so innerHTML is
    // safe. View-rendered, user-typed values go through lit-html, which escapes.
    const styleTag = styles ? `<style>${styles}</style>` : '';
    container.innerHTML = `${styleTag}<div can-play id="${elementId}">${skeleton}</div>`;

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
  }, [elementId, init, skeleton, styles, onReady]);

  return <div ref={containerRef} className="live-html-demo" />;
}
