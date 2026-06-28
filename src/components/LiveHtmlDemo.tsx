// ABOUTME: Renders raw HTML snippets with playhtml wired up live. Isolated
// ABOUTME: behind an error boundary so one broken demo can't break the page.

import { playhtml } from '@playhtml/react';
import { Component, useEffect, useRef, type ReactNode } from 'react';

const PLAYHTML_SELECTOR =
  '[can-toggle], [can-move], [can-spin], [can-grow], [can-duplicate], [can-mirror], [can-play], [can-hover]';

interface LiveHtmlDemoProps {
  html: string;
  onMount?: (container: HTMLDivElement) => void | (() => void);
}

export function LiveHtmlDemo({ html, onMount }: LiveHtmlDemoProps) {
  return (
    <DemoBoundary>
      <LiveHtmlDemoRunner html={html} onMount={onMount} />
    </DemoBoundary>
  );
}

function LiveHtmlDemoRunner({ html, onMount }: LiveHtmlDemoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = html;
    const playElements = Array.from(
      container.querySelectorAll<HTMLElement>(PLAYHTML_SELECTOR),
    );

    playElements.forEach((element) => {
      try {
        void playhtml.setupPlayElement(element);
      } catch (error) {
        console.error('Failed to set up playhtml demo element', error);
      }
    });

    const cleanupMount = onMount?.(container);

    return () => {
      cleanupMount?.();
      playElements.forEach((element) => {
        try {
          playhtml.removePlayElement(element);
        } catch {
          // Element may already be torn down; ignore.
        }
      });
      container.innerHTML = '';
    };
  }, [html, onMount]);

  return <div ref={containerRef} className="live-html-demo" />;
}

interface DemoBoundaryProps {
  children: ReactNode;
}

class DemoBoundary extends Component<DemoBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Live demo crashed', error);
  }

  render() {
    if (this.state.failed) {
      return <div className="week-demo__error">demo unavailable</div>;
    }

    return this.props.children;
  }
}
