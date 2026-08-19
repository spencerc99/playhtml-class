// ABOUTME: Verifies the Week 2 bunny demo keeps a bounded shared count.
// ABOUTME: Exercises its rendered bunnies and clone/remove controls without a server.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { configureBunnyDemo } from './bunnyDemo';
import { MIRROR_TEXTAREA_MAX_LENGTH } from './WeekTwoDemos';

interface BunnyData {
  count: number;
}

interface BunnyEventData {
  setData: (update: BunnyData | ((data: BunnyData) => void)) => void;
}

interface BunnyDemoElement extends HTMLDivElement {
  defaultData: BunnyData;
  onClick?: (event: MouseEvent, eventData: BunnyEventData) => void;
  updateElement?: (eventData: {
    data: BunnyData;
    element: HTMLElement;
  }) => void;
}

function createBunnyDemo() {
  const container = document.createElement('div');
  container.innerHTML = `
    <div can-play id="bunny-demo">
      <button data-bunny-action="clone">clone bunny</button>
      <button data-bunny-action="remove">remove bunny</button>
      <span data-bunny-count></span>
      <div data-bunny-pen></div>
    </div>
  `;

  configureBunnyDemo(container);

  return container.querySelector<BunnyDemoElement>('#bunny-demo')!;
}

describe('Week 2 bunny demo', () => {
  it('starts with and renders 10 bunnies', () => {
    const demo = createBunnyDemo();

    demo.updateElement?.({
      data: demo.defaultData,
      element: demo,
    });

    expect(demo.querySelectorAll('[data-bunny-pen] img')).toHaveLength(10);
    expect(demo.querySelector('[data-bunny-count]')?.textContent).toBe(
      '10 / 70 bunnies',
    );
    expect(
      demo.querySelector<HTMLButtonElement>('[data-bunny-action="clone"]')
        ?.disabled,
    ).toBe(false);
  });

  it('keeps clone and remove actions between zero and 70', () => {
    const demo = createBunnyDemo();
    const data = { count: 69 };
    const setData = vi.fn((update: (draft: BunnyData) => void) => update(data));
    const eventData = {
      setData,
    } as BunnyEventData;

    const click = (action: 'clone' | 'remove') => {
      const button = demo.querySelector<HTMLButtonElement>(
        `[data-bunny-action="${action}"]`,
      )!;
      button.addEventListener(
        'click',
        (event) => demo.onClick?.(event, eventData),
        { once: true },
      );
      button.click();
    };

    click('clone');
    expect(data.count).toBe(70);
    click('clone');
    expect(data.count).toBe(70);

    for (let index = 0; index < 72; index += 1) {
      click('remove');
    }
    expect(data.count).toBe(0);

    for (let index = 0; index < 72; index += 1) {
      click('clone');
    }
    expect(data.count).toBe(70);
  });
});

describe('Week 2 mirror textarea', () => {
  it('caps shared text at 1,000 characters', () => {
    expect(MIRROR_TEXTAREA_MAX_LENGTH).toBe(1000);

    const demoSource = readFileSync(
      resolve(process.cwd(), 'src/components/WeekTwoDemos.tsx'),
      'utf8',
    );
    const lessonSource = readFileSync(
      resolve(process.cwd(), 'src/content/weeks/week-2.mdx'),
      'utf8',
    );

    expect(demoSource).toContain('maxlength="${MIRROR_TEXTAREA_MAX_LENGTH}"');
    expect(lessonSource).toContain('maxlength="1000"');
  });
});
