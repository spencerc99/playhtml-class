// ABOUTME: Live week 3 demos for can-play (imperative updateElement + view API),
// ABOUTME: plus presence (awareness) and one-shot events for the sync/async tour.

// Import lit helpers from playhtml (not the app's separate `lit`) so `view`
// templates are built with the SAME lit-html instance playhtml renders with —
// otherwise the templates aren't recognized and the element renders empty.
import { html, playhtml, repeat, styleMap } from 'playhtml';
import { useCallback, useEffect } from 'react';
import { CanPlayDemo, type CanPlayInit } from './CanPlayDemo';
import { LiveHtmlDemo } from './LiveHtmlDemo';

// Read the current visitor's cursor profile (set via the profile pill). Falls
// back gracefully when nobody has set a name/color yet. Read lazily at call
// time so it reflects the latest profile rather than a stale mount-time value.
interface Profile {
  name: string;
  color: string;
}

function getProfile(): Profile {
  const cursors = (
    window as unknown as { cursors?: { name?: string; color?: string } }
  ).cursors;
  return {
    name: cursors?.name?.trim() || 'someone',
    color: cursors?.color || '#e00000',
  };
}

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
  count: number;
}

function checkInButtonStyles(id: string) {
  return `
  #${id} {
    font-family: var(--font-body);
    width: min(100%, 18rem);
  }
  #${id} button {
    background: #fff4d6;
    border: 1px solid rgba(247, 220, 156, 0.8);
    border-radius: 0.5rem;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
    padding: 0.5rem 0.85rem;
  }
  #${id} p {
    margin: 0;
    font-size: 0.95rem;
  }
  #${id} .count {
    font-size: 1.5rem;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
`;
}

const visitCounterSkeleton = `
  <button type="button">I'm here!</button>
  <p><span class="count">0</span> people have checked in</p>
`;

const visitCounterInit: CanPlayInit<CounterData> = {
  defaultData: { count: 0 },
  updateElement: ({ element, data }) => {
    const countEl = element.querySelector<HTMLElement>('.count');
    if (countEl) countEl.textContent = String(data.count);
  },
  onClick: (event, { setData }) => {
    const target = event.target as HTMLElement;
    if (!target.closest('button')) return;
    setData((data) => {
      data.count += 1;
    });
  },
};

export function VisitCounterDemo() {
  return (
    <CanPlayDemo
      elementId="week3-visit-counter"
      skeleton={visitCounterSkeleton}
      styles={checkInButtonStyles('week3-visit-counter')}
      init={visitCounterInit}
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
  name: string;
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
          name: getProfile().name,
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
          (entry: GuestbookEntry) => html`
            <li>
              ${entry.name}: ${entry.message}
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

// --- Sync/async tour: richer state, presence, and a one-shot event ---------

interface RecentVisit {
  id: string;
  name: string;
  color: string;
  at: number;
}

interface VisitLogData {
  count: number;
  // Capped to the most recent few — defaultData should stay small, so we trim
  // on write rather than letting the list grow forever.
  recent: RecentVisit[];
}

const RECENT_LIMIT = 5;

const visitLogInit: CanPlayInit<VisitLogData> = {
  defaultData: { count: 0, recent: [] },
  updateElement: ({ element, data }) => {
    const countEl = element.querySelector<HTMLElement>('.count');
    if (countEl) countEl.textContent = String(data.count);

    const list = element.querySelector<HTMLUListElement>('.recent');
    if (!list) return;
    // Build rows with textContent (never innerHTML) — names come from other
    // visitors, so treating them as plain text avoids any HTML injection.
    list.replaceChildren(
      ...[...data.recent].reverse().map((visit) => {
        const row = document.createElement('li');
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.style.background = visit.color;
        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = visit.name;
        const time = document.createElement('small');
        time.textContent = new Date(visit.at).toLocaleTimeString();
        row.append(dot, name, time);
        return row;
      }),
    );
  },
  onClick: (event, { setData }) => {
    const target = event.target as HTMLElement;
    if (!target.closest('button')) return;
    const { name, color } = getProfile();
    setData((data) => {
      data.count += 1;
      data.recent.push({
        id: crypto.randomUUID(),
        name,
        color,
        at: Date.now(),
      });
      const overflow = data.recent.length - RECENT_LIMIT;
      if (overflow > 0) data.recent.splice(0, overflow);
    });
  },
};

const visitLogSkeleton = `
  <button type="button">I'm here!</button>
  <p><span class="count">0</span> people have checked in</p>
  <p class="recent-label">recent visitors</p>
  <ul class="recent"></ul>
`;

function visitLogStyles(id: string) {
  return `
  ${checkInButtonStyles(id)}
  #${id} .recent-label { margin: 0.5rem 0 0.3rem; font-size: 0.8rem; opacity: 0.6; }
  #${id} .recent { display: flex; flex-direction: column; gap: 0.3rem; list-style: none; margin: 0; padding: 0; }
  #${id} .recent li { align-items: center; background: #f7f4ee; border-radius: 0.4rem; display: flex; gap: 0.5rem; padding: 0.35rem 0.5rem; font-size: 0.9rem; }
  #${id} .recent .dot { border-radius: 50%; flex-shrink: 0; height: 0.7rem; width: 0.7rem; }
  #${id} .recent .name { flex: 1; }
  #${id} .recent small { font-size: 0.72rem; opacity: 0.5; white-space: nowrap; }
`;
}

export function VisitCounterRecentDemo() {
  return (
    <CanPlayDemo
      elementId="week3-visit-log"
      skeleton={visitLogSkeleton}
      styles={visitLogStyles('week3-visit-log')}
      init={visitLogInit}
    />
  );
}

interface EmojiPresence {
  emoji: string;
}

const EMOJI_ORBIT_RADIUS = 90;

interface EmojiOrbitEntry {
  emoji: string;
  isMe: boolean;
}

function layoutEmojiOrbit(orbit: HTMLElement, emojis: EmojiOrbitEntry[]) {
  const count = emojis.length;
  if (count === 0) {
    orbit.replaceChildren();
    return;
  }

  orbit.replaceChildren(
    ...emojis.map(({ emoji, isMe }, index) => {
      const span = document.createElement('span');
      console.log(isMe);
      span.className = isMe ? 'emoji mine' : 'emoji';
      span.textContent = emoji;
      const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
      span.style.left = `calc(50% + ${Math.cos(angle) * EMOJI_ORBIT_RADIUS}px)`;
      span.style.top = `calc(50% + ${Math.sin(angle) * EMOJI_ORBIT_RADIUS}px)`;
      return span;
    }),
  );
}

// Each visitor publishes one emoji via awareness — ephemeral, not saved.
const emojiCircleInit: CanPlayInit<Record<string, never>, EmojiPresence> = {
  defaultData: {},
  myDefaultAwareness: { emoji: '' },
  updateElement: () => {},
  onMount: ({ getElement, setMyAwareness }) => {
    const input = getElement().querySelector<HTMLInputElement>('.emoji-input');
    if (!input) return;

    const handleInput = () => {
      const emoji = [...input.value].slice(0, 1).join('');
      if (input.value !== emoji) input.value = emoji;
      setMyAwareness({ emoji });
    };

    input.addEventListener('input', handleInput);
    return () => input.removeEventListener('input', handleInput);
  },
  updateElementAwareness: ({ element, awareness, myAwareness }) => {
    const emojis = awareness
      .filter((entry): entry is EmojiPresence => Boolean(entry?.emoji))
      .map((entry) => ({
        emoji: entry.emoji,
        isMe: entry === myAwareness,
      }));
    const orbit = element.querySelector<HTMLElement>('.orbit');
    if (!orbit) return;
    layoutEmojiOrbit(orbit, emojis);
  },
};

const emojiCircleSkeleton = `
  <div class="hub">
    <input class="emoji-input" type="text" maxlength="4" placeholder="?" aria-label="pick an emoji" />
  </div>
  <div class="orbit"></div>
`;

function emojiCircleStyles(id: string) {
  return `
  #${id} {
    font-family: var(--font-body);
    height: 15rem;
    position: relative;
    width: 15rem;
  }
  #${id}::before {
    border: 1px dashed rgba(0, 0, 0, 0.12);
    border-radius: 50%;
    content: '';
    height: 11.25rem;
    left: 50%;
    pointer-events: none;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 11.25rem;
  }
  #${id} .hub {
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
  }
  #${id} .emoji-input {
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 0.5rem;
    font-size: 1.25rem;
    height: 2.5rem;
    padding: 0;
    text-align: center;
    width: 2.5rem;
  }
  #${id} .orbit {
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
  #${id} .orbit .emoji {
    font-size: 1.35rem;
    line-height: 1;
    position: absolute;
    transform: translate(-50%, -50%);
  }
  #${id} .orbit .emoji.mine {
    background: radial-gradient(circle, red 0%, red 50%, transparent 100%);
  }
`;
}

export function EmojiCircleDemo() {
  return (
    <CanPlayDemo<Record<string, never>, EmojiPresence>
      elementId="week3-emoji-circle"
      skeleton={emojiCircleSkeleton}
      styles={emojiCircleStyles('week3-emoji-circle')}
      init={emojiCircleInit}
    />
  );
}

const ALL_COLORS_MARKUP = `
<style>
  #all-colors {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  #all-colors .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid white;
    flex-shrink: 0;
  }
</style>
<div id="all-colors"></div>
`;

export function AllColorsDemo() {
  const onMount = useCallback((container: HTMLDivElement) => {
    const allColorsEl = container.querySelector<HTMLElement>('#all-colors');
    if (!allColorsEl) return;

    const target = allColorsEl;

    // Same logic as the HTML snippet in week-3.mdx (scripts don't run via
    // innerHTML, so LiveHtmlDemo wires it here instead).
    function showColors(colors: string[]) {
      target.replaceChildren(
        ...colors.map((color) => {
          const dot = document.createElement('span');
          dot.className = 'dot';
          dot.style.backgroundColor = color;
          return dot;
        }),
      );
    }

    let cancelled = false;

    void playhtml.ready.then(() => {
      if (cancelled) return;
      const cursors = (
        window as unknown as {
          cursors?: {
            allColors: string[];
            on: (event: 'allColors', cb: (colors: string[]) => void) => void;
            off: (event: 'allColors', cb: (colors: string[]) => void) => void;
          };
        }
      ).cursors;
      if (!cursors) return;

      showColors(cursors.allColors);
      cursors.on('allColors', showColors);
    });

    return () => {
      cancelled = true;
      (
        window as unknown as {
          cursors?: {
            off: (event: 'allColors', cb: (colors: string[]) => void) => void;
          };
        }
      ).cursors?.off('allColors', showColors);
    };
  }, []);

  return <LiveHtmlDemo html={ALL_COLORS_MARKUP} onMount={onMount} />;
}

interface HoverInfo {
  hovering: boolean;
}

const HOVER_GOAL = 3;
const ZONE_CELEBRATE = 'zone-celebrate';

// Track the previous hovering count locally so we only fire as the count
// *crosses* the goal, not on every awareness tick. (Each client crosses at the
// same moment, so the event may fire once per client — fine for a one-shot
// celebration; dedupe later if you need exactly one.)
let zoneWasBelowGoal = true;

const hoverZoneInit: CanPlayInit<Record<string, never>, HoverInfo> = {
  defaultData: {},
  myDefaultAwareness: { hovering: false },
  // No saved data — the zone reacts to presence only — but register still
  // needs an updateElement, so this stays a no-op.
  updateElement: () => {},
  onMount: ({ getElement, setMyAwareness }) => {
    const el = getElement();
    el.addEventListener('mouseenter', () => setMyAwareness({ hovering: true }));
    el.addEventListener('mouseleave', () =>
      setMyAwareness({ hovering: false }),
    );
  },
  updateElementAwareness: ({ element, awareness }) => {
    const hovering = (awareness.filter(Boolean) as HoverInfo[]).filter(
      (a) => a.hovering,
    ).length;
    const countEl = element.querySelector<HTMLElement>('.count');
    if (countEl) countEl.textContent = String(hovering);

    if (hovering >= HOVER_GOAL && zoneWasBelowGoal) {
      // One-shot, not persisted: everyone present runs the listener once.
      playhtml.dispatchPlayEvent({ type: ZONE_CELEBRATE });
    }
    zoneWasBelowGoal = hovering < HOVER_GOAL;
  },
};

const hoverSkeleton = `
  <p class="zone-label">hover here together</p>
  <p class="zone-count"><span class="count">0</span>/${HOVER_GOAL} hovering</p>
`;

function hoverStyles(id: string) {
  return `
  #${id} { align-items: center; background: #f3efe9; border: 1px dashed rgba(0,0,0,0.2); border-radius: 0.75rem; cursor: pointer; display: flex; flex-direction: column; font-family: var(--font-body); gap: 0.25rem; justify-content: center; min-height: 7rem; text-align: center; width: min(100%, 18rem); }
  @keyframes zone-spin { to { transform: rotate(1080deg); } }
  #${id}.celebrate { animation: zone-spin 0.9s ease-in-out; }
  #${id} .zone-label { margin: 0; font-size: 0.95rem; }
  #${id} .zone-count { margin: 0; font-size: 0.8rem; opacity: 0.6; }
  #${id} .count { font-weight: 600; font-variant-numeric: tabular-nums; }
`;
}

export function HoverZoneDemo() {
  useEffect(() => {
    // The event listener gets proper cleanup here in React (the register init
    // has no teardown hook). Dispatch happens inside updateElementAwareness.
    const listenerId = playhtml.registerPlayEventListener(ZONE_CELEBRATE, {
      onEvent: () => {
        const zone = document.getElementById('week3-hover-zone');
        if (!zone) return;
        zone.classList.add('celebrate');
        zone.addEventListener(
          'animationend',
          () => zone.classList.remove('celebrate'),
          { once: true },
        );
      },
    });
    return () => playhtml.removePlayEventListener(ZONE_CELEBRATE, listenerId);
  }, []);

  return (
    <CanPlayDemo<Record<string, never>, HoverInfo>
      elementId="week3-hover-zone"
      skeleton={hoverSkeleton}
      styles={hoverStyles('week3-hover-zone')}
      init={hoverZoneInit}
    />
  );
}
