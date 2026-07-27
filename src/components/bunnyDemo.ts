// ABOUTME: Configures the Week 2 bunny demo with a bounded shared count.
// ABOUTME: Renders bunny images locally so the shared document stays small.

const BUNNY_SRC = '/pixel-bunny.png';
const MAX_BUNNIES = 10;

interface BunnyData {
  count: number;
}

interface BunnyEventData {
  setData: (update: BunnyData | ((data: BunnyData) => void)) => void;
}

interface BunnyUpdateData {
  data: BunnyData;
  element: HTMLElement;
}

interface BunnyDemoElement extends HTMLDivElement {
  defaultData?: BunnyData;
  onClick?: (event: MouseEvent, eventData: BunnyEventData) => void;
  updateElement?: (eventData: BunnyUpdateData) => void;
}

export function configureBunnyDemo(container: HTMLDivElement) {
  const demo = container.querySelector<BunnyDemoElement>('#bunny-demo');

  if (!demo) {
    throw new Error('Missing bunny demo element.');
  }

  demo.defaultData = { count: MAX_BUNNIES };
  demo.updateElement = ({ data, element }) => {
    if (
      !Number.isInteger(data.count) ||
      data.count < 0 ||
      data.count > MAX_BUNNIES
    ) {
      throw new Error(`Invalid bunny count: ${data.count}`);
    }

    const pen = element.querySelector<HTMLDivElement>('[data-bunny-pen]');
    const count = element.querySelector<HTMLElement>('[data-bunny-count]');
    const cloneButton = element.querySelector<HTMLButtonElement>(
      '[data-bunny-action="clone"]',
    );
    const removeButton = element.querySelector<HTMLButtonElement>(
      '[data-bunny-action="remove"]',
    );

    if (!pen || !count || !cloneButton || !removeButton) {
      throw new Error('Missing bunny demo controls.');
    }

    const bunnies = Array.from({ length: data.count }, () => {
      const bunny = document.createElement('img');
      bunny.src = BUNNY_SRC;
      bunny.alt = '';
      return bunny;
    });

    pen.replaceChildren(...bunnies);
    count.textContent = `${data.count} / ${MAX_BUNNIES} bunnies`;
    cloneButton.disabled = data.count === MAX_BUNNIES;
    removeButton.disabled = data.count === 0;
  };
  demo.onClick = (event, { setData }) => {
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-bunny-action]')
        : null;

    if (!target || !demo.contains(target)) {
      return;
    }

    const action = target.dataset.bunnyAction;

    if (action !== 'clone' && action !== 'remove') {
      throw new Error(`Invalid bunny action: ${action}`);
    }

    setData((data) => {
      if (action === 'clone' && data.count < MAX_BUNNIES) {
        data.count += 1;
      }

      if (action === 'remove' && data.count > 0) {
        data.count -= 1;
      }
    });
  };
}
