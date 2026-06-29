// ABOUTME: Live week 3 demos for can-play (imperative updateElement + view API).

import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { CanPlayDemo, type CanPlayInit } from './CanPlayDemo';

const POLL_OPTIONS = [
  { id: 'plants', label: 'more plants', votes: 0 },
  { id: 'jukebox', label: 'a jukebox', votes: 0 },
  { id: 'rug', label: 'a cozy rug', votes: 0 },
];

function pollStyles(id: string) {
  return `
  #${id} {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: min(100%, 18rem);
  }
  #${id} button {
    align-items: center;
    background: #f7f4ee;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 0.5rem;
    cursor: pointer;
    display: grid;
    font-family: var(--font-body);
    font-size: 0.9rem;
    gap: 0.5rem;
    grid-template-columns: 1fr auto;
    overflow: hidden;
    padding: 0.5rem 0.7rem;
    position: relative;
    text-align: left;
  }
  #${id} .bar {
    background: rgba(108, 217, 126, 0.4);
    bottom: 0;
    left: 0;
    position: absolute;
    top: 0;
    transition: width 0.3s ease;
    width: 0;
    z-index: 0;
  }
  #${id} .label,
  #${id} .count {
    position: relative;
    z-index: 1;
  }
  #${id} .count {
    font-variant-numeric: tabular-nums;
    opacity: 0.65;
  }
  #${id} p {
    margin: 0.15rem 0 0;
    font-size: 0.8rem;
    opacity: 0.6;
  }
`;
}

interface CounterData {
  visits: number;
}

const visitCounterInit: CanPlayInit<CounterData> = {
  defaultData: { visits: 0 },
  updateElement: ({ element, data }) => {
    element.textContent = String(data.visits);
  },
};

export function VisitCounterDemo() {
  return (
    <CanPlayDemo
      elementId="week3-visit-counter"
      skeleton="0"
      styles={`#week3-visit-counter { font-size: 2.5rem; font-weight: 600; font-variant-numeric: tabular-nums; }`}
      init={visitCounterInit}
      onReady={(handle) =>
        handle.setData({ visits: handle.getData().visits + 1 })
      }
    />
  );
}

interface PollOption {
  id: string;
  label: string;
  votes: number;
}

interface PollData {
  options: PollOption[];
}

const pollImperativeInit: CanPlayInit<PollData> = {
  defaultData: { options: POLL_OPTIONS },
  updateElement: ({ element, data }) => {
    const total = data.options.reduce((sum, o) => sum + o.votes, 0);
    data.options.forEach((option) => {
      const row = element.querySelector<HTMLElement>(
        `[data-id="${option.id}"]`,
      );
      if (!row) return;
      const percent = total ? (option.votes / total) * 100 : 0;
      const bar = row.querySelector<HTMLElement>('.bar');
      const count = row.querySelector<HTMLElement>('.count');
      if (bar) bar.style.width = percent + '%';
      if (count) count.textContent = String(option.votes);
    });
    const totalEl = element.querySelector<HTMLElement>('.total');
    if (totalEl) totalEl.textContent = total + ' votes';
  },
  onClick: (event, { setData }) => {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>('[data-id]');
    if (!row) return;
    const { id } = row.dataset;
    setData((draft) => {
      const option = draft.options.find((o) => o.id === id);
      if (option) option.votes += 1;
    });
  },
};

const pollSkeleton = `
${POLL_OPTIONS.map(
  (option) => `  <button data-id="${option.id}">
    <span class="bar"></span>
    <span class="label">${option.label}</span>
    <span class="count">0</span>
  </button>`,
).join('\n')}
  <p class="total">0 votes</p>
`;

export function PollImperativeDemo() {
  return (
    <CanPlayDemo
      elementId="week3-poll-imperative"
      skeleton={pollSkeleton}
      styles={pollStyles('week3-poll-imperative')}
      init={pollImperativeInit}
    />
  );
}

const pollViewInit: CanPlayInit<PollData> = {
  defaultData: { options: POLL_OPTIONS },
  view: ({ data, setData }) => {
    const total = data.options.reduce((sum, o) => sum + o.votes, 0);
    const vote = (id: string) =>
      setData((draft) => {
        const option = draft.options.find((o) => o.id === id);
        if (option) option.votes += 1;
      });

    return html`
      ${repeat(
        data.options,
        (option: PollOption) => option.id,
        (option: PollOption) => {
          const percent = total ? (option.votes / total) * 100 : 0;
          return html`
            <button @click=${() => vote(option.id)}>
              <span
                class="bar"
                style=${styleMap({ width: percent + '%' })}
              ></span>
              <span class="label">${option.label}</span>
              <span class="count">${option.votes}</span>
            </button>
          `;
        },
      )}
      <p>${total} votes</p>
    `;
  },
};

export function PollViewDemo() {
  return (
    <CanPlayDemo
      elementId="week3-poll-view"
      styles={pollStyles('week3-poll-view')}
      init={pollViewInit}
    />
  );
}

interface GuestbookEntry {
  id: string;
  message: string;
  at: number;
}

interface GuestbookData {
  entries: GuestbookEntry[];
}

const guestbookInit: CanPlayInit<GuestbookData> = {
  defaultData: { entries: [] },
  view: ({ data, setData }) => {
    const sign = (event: Event) => {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      const input = form.querySelector('input');
      if (!input) return;
      const message = input.value.trim();
      if (!message) return;
      setData((draft) => {
        draft.entries.push({
          id: crypto.randomUUID(),
          message,
          at: Date.now(),
        });
      });
      input.value = '';
    };

    return html`
      <p>${data.entries.length} notes left</p>
      <form @submit=${sign}>
        <input placeholder="leave a note..." />
        <button type="submit">sign</button>
      </form>
      <ul>
        ${repeat(
          [...data.entries].reverse(),
          (entry: GuestbookEntry) => entry.id,
          (entry: GuestbookEntry) => html`
            <li>
              <span>${entry.message}</span>
              <small>${new Date(entry.at).toLocaleTimeString()}</small>
            </li>
          `,
        )}
      </ul>
    `;
  },
};

function guestbookStyles(id: string) {
  return `
  #${id} {
    font-family: var(--font-body);
    width: min(100%, 18rem);
  }
  #${id} > p {
    margin: 0 0 0.4rem;
    font-size: 0.8rem;
    opacity: 0.6;
  }
  #${id} form {
    display: flex;
    gap: 0.4rem;
    margin: 0 0 0.5rem;
  }
  #${id} input {
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 0.4rem;
    flex: 1;
    font-family: inherit;
    font-size: 0.9rem;
    min-width: 0;
    padding: 0.4rem 0.5rem;
  }
  #${id} form button {
    background: #d7ecff;
    border: 1px solid rgba(44, 202, 255, 0.5);
    border-radius: 0.4rem;
    color: #1a6fa3;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.85rem;
    padding: 0.4rem 0.7rem;
  }
  #${id} ul {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  #${id} li {
    align-items: center;
    background: #f7f4ee;
    border-radius: 0.4rem;
    display: flex;
    font-size: 0.9rem;
    gap: 0.5rem;
    justify-content: space-between;
    padding: 0.35rem 0.5rem;
  }
  #${id} li small {
    font-size: 0.72rem;
    opacity: 0.5;
    white-space: nowrap;
  }
`;
}

export function GuestbookViewDemo() {
  return (
    <CanPlayDemo
      elementId="week3-guestbook"
      styles={guestbookStyles('week3-guestbook')}
      init={guestbookInit}
    />
  );
}
