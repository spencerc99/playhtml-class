// ABOUTME: Live, collaborative can-toggle demos shown beside week 1 code
// ABOUTME: snippets so students see each effect synced across viewers.

import { CanToggleElement } from '@playhtml/react';

const LAMP_GLOW =
  'brightness(1.2) saturate(1.6) drop-shadow(0px 0px 50px rgba(247, 220, 156, 0.85))';

export function LampDemo() {
  return (
    <CanToggleElement>
      {({ data }) => {
        const on = typeof data === 'object' ? data.on : data;
        return (
          <img
            id="week1-lamp"
            src="https://shop.noguchi.org/cdn/shop/products/1A_on_2048x.jpg?v=1567364979"
            alt="Hanging lamp"
            className="week-demo__lamp"
            style={{ filter: on ? LAMP_GLOW : 'brightness(0.55)' }}
          />
        );
      }}
    </CanToggleElement>
  );
}

export function ColorToggleDemo() {
  return (
    <CanToggleElement>
      {({ data }) => {
        const on = typeof data === 'object' ? data.on : data;
        return (
          <button
            type="button"
            className="week-demo__box"
            style={{ background: on ? '#6cd97e' : '#f3efe9' }}
          >
            {on ? 'on' : 'off'}
          </button>
        );
      }}
    </CanToggleElement>
  );
}

export function GlowToggleDemo() {
  return (
    <CanToggleElement>
      {({ data }) => {
        const on = typeof data === 'object' ? data.on : data;
        return (
          <button
            type="button"
            className="week-demo__box week-demo__box--lamp"
            style={{ filter: on ? LAMP_GLOW : 'brightness(0.5)' }}
          >
            💡
          </button>
        );
      }}
    </CanToggleElement>
  );
}

export function ScaleToggleDemo() {
  return (
    <CanToggleElement>
      {({ data }) => {
        const on = typeof data === 'object' ? data.on : data;
        return (
          <button
            type="button"
            className="week-demo__box week-demo__box--scale"
            style={{ transform: on ? 'scale(2)' : 'scale(1)' }}
          >
            ▢
          </button>
        );
      }}
    </CanToggleElement>
  );
}
