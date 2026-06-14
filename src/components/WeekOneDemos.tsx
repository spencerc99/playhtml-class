// ABOUTME: Live week 1 demos built from real HTML + vanilla playhtml, run via
// ABOUTME: setupPlayElement and isolated so one broken demo can't break the page.

import { playhtml } from '@playhtml/react';
import { Component, useEffect, useRef, type ReactNode } from 'react';

const LAMP_GLOW =
  'brightness(1.2) saturate(1.6) drop-shadow(0px 0px 50px rgba(247, 220, 156, 0.85))';

const LAMP_SRC =
  'https://shop.noguchi.org/cdn/shop/products/1A_on_2048x.jpg?v=1567364979';

// Each demo is real HTML a student could paste, using can-toggle + a <style>.
// The id makes collaborative state sync; keep it unique per demo.
export function LampDemo() {
  return (
    <HtmlDemo
      html={`
<style>
  #demo-lamp { width: 6rem; height: 6rem; object-fit: contain; cursor: pointer; filter: brightness(0.55); transition: filter 0.3s ease; }
  #demo-lamp.clicked { filter: ${LAMP_GLOW}; }
</style>
<img id="demo-lamp" class="week-demo__lamp" can-toggle src="${LAMP_SRC}" alt="Hanging lamp" />
`}
    />
  );
}

export function ColorToggleDemo() {
  return (
    <HtmlDemo
      html={`
<style>
  #demo-color { background: #f3efe9; transition: background 0.3s ease; }
  #demo-color.clicked { background: #6cd97e; }
</style>
<button id="demo-color" class="week-demo__box" type="button" can-toggle>off</button>
`}
    />
  );
}

export function GlowToggleDemo() {
  return (
    <HtmlDemo
      html={`
<style>
  #demo-glow { filter: brightness(0.5); transition: filter 0.3s ease; }
  #demo-glow.clicked { filter: ${LAMP_GLOW}; }
</style>
<button id="demo-glow" class="week-demo__box week-demo__box--lamp" type="button" can-toggle>💡</button>
`}
    />
  );
}

export function ScaleToggleDemo() {
  return (
    <HtmlDemo
      html={`
<style>
  #demo-scale { transform: scale(1); transition: transform 0.3s ease; }
  #demo-scale.clicked { transform: scale(2); }
</style>
<button id="demo-scale" class="week-demo__box week-demo__box--scale" type="button" can-toggle>▢</button>
`}
    />
  );
}

interface HtmlDemoProps {
  html: string;
}

// Renders a raw HTML snippet and wires up its playhtml elements live. Isolated
// behind an error boundary so a failing demo shows a fallback, not a blank page.
function HtmlDemo({ html }: HtmlDemoProps) {
  return (
    <DemoBoundary>
      <HtmlDemoRunner html={html} />
    </DemoBoundary>
  );
}

function HtmlDemoRunner({ html }: HtmlDemoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = html;
    const playElements = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[can-toggle], [can-move], [can-spin], [can-grow]',
      ),
    );

    playElements.forEach((element) => {
      try {
        void playhtml.setupPlayElement(element);
      } catch (error) {
        console.error('Failed to set up playhtml demo element', error);
      }
    });

    return () => {
      playElements.forEach((element) => {
        try {
          playhtml.removePlayElement(element);
        } catch {
          // Element may already be torn down; ignore.
        }
      });
      container.innerHTML = '';
    };
  }, [html]);

  return <div ref={containerRef} />;
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
