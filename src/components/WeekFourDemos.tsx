// ABOUTME: Live week 4 demos — soft admin gates on a guestbook, a shared-element
// ABOUTME: source, and a webring that treats recent shared heartbeats as "home".

import { withSharedState } from '@playhtml/react';
import { html, playhtml, repeat } from 'playhtml';
import { useEffect, useState, type RefObject } from 'react';
import { CanPlayDemo, type CanPlayInit } from './CanPlayDemo';
import {
  BEACON_FRESHNESS_POLL_MS,
  isHomeBeaconLive,
  pageBeaconIdForPath,
  pageHomeBeaconDataSource,
  type HomeBeaconData,
} from './HomeBeaconOrb';

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

// --- Permissions: guestbook with soft admin gates -------------------------------

interface GuestbookEntry {
  name: string;
  message: string;
  at: number;
}

interface GuestbookData {
  entries: GuestbookEntry[];
  // Soft room lock — when true, nobody can sign (existing notes stay).
  frozen: boolean;
}

const ADMIN_STORAGE_KEY = 'week4-admin';
export const WEEK4_GUESTBOOK_ID = 'week4-guestbook';

function isAdminUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).has('admin')) return true;
  return window.sessionStorage.getItem(ADMIN_STORAGE_KEY) === '1';
}

function unlockAdmin(): void {
  window.sessionStorage.setItem(ADMIN_STORAGE_KEY, '1');
}

// Cmd/Ctrl+Shift+A — simpler than Konami. Soft gate only.
function isAdminShortcut(event: KeyboardEvent): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    event.shiftKey &&
    event.key.toLowerCase() === 'a'
  );
}

function guestbookStyles(id: string) {
  return `
  #${id} {
    font-family: var(--font-body);
    width: min(100%, 20rem);
  }
  #${id} .admin-bar {
    align-items: center;
    background: #fff4d6;
    border: 1px solid rgba(247, 220, 156, 0.9);
    border-radius: 0.4rem;
    display: none;
    font-size: 0.78rem;
    margin-bottom: 0.5rem;
    padding: 0.35rem 0.5rem;
  }
  #${id}.is-admin .admin-bar { display: flex; }
  #${id} > p {
    margin: 0 0 0.4rem;
    font-size: 0.8rem;
    opacity: 0.6;
  }
  #${id} form.sign {
    display: flex;
    gap: 0.4rem;
    margin: 0 0 0.5rem;
  }
  #${id} form.sign input {
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 0.4rem;
    flex: 1;
    font-family: inherit;
    font-size: 0.9rem;
    min-width: 0;
    padding: 0.4rem 0.5rem;
  }
  #${id} form.sign button {
    background: #d7ecff;
    border: 1px solid rgba(44, 202, 255, 0.5);
    border-radius: 0.4rem;
    color: #1a6fa3;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.85rem;
    padding: 0.4rem 0.7rem;
  }
  #${id} form.sign button:disabled,
  #${id} form.sign input:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  #${id} .frozen-banner {
    background: #eef2ff;
    border: 1px solid rgba(80, 100, 180, 0.35);
    border-radius: 0.4rem;
    color: #334;
    display: none;
    font-size: 0.8rem;
    margin: 0 0 0.5rem;
    padding: 0.4rem 0.55rem;
  }
  #${id}.is-frozen .frozen-banner { display: block; }
  #${id} ul {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  #${id} li {
    align-items: flex-start;
    background: #f7f4ee;
    border-radius: 0.4rem;
    display: flex;
    font-size: 0.9rem;
    gap: 0.5rem;
    justify-content: space-between;
    padding: 0.35rem 0.5rem;
  }
  #${id} li .body { flex: 1; min-width: 0; }
  #${id} li small {
    display: block;
    font-size: 0.72rem;
    margin-top: 0.15rem;
    opacity: 0.5;
  }
  #${id} li .delete {
    background: transparent;
    border: none;
    color: #a40000;
    cursor: pointer;
    display: none;
    font-family: inherit;
    font-size: 0.75rem;
    padding: 0;
  }
  #${id}.is-admin li .delete { display: inline; }
  #${id} .hint {
    font-size: 0.72rem;
    margin: 0.45rem 0 0;
    opacity: 0.55;
  }
`;
}

const guestbookInit: CanPlayInit<GuestbookData> = {
  defaultData: { entries: [], frozen: false },
  onMount: ({ getElement, setData, requestUpdate }) => {
    const element = getElement();

    const syncAdminClass = () => {
      element.classList.toggle('is-admin', isAdminUnlocked());
      requestUpdate();
    };
    syncAdminClass();

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isAdminShortcut(event)) return;
      event.preventDefault();
      unlockAdmin();
      syncAdminClass();
    };
    window.addEventListener('keydown', onKeyDown);

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const deleteBtn = target.closest<HTMLElement>('[data-delete-at]');
      if (!deleteBtn || !isAdminUnlocked()) return;
      const at = Number(deleteBtn.dataset.deleteAt);
      setData((draft) => {
        const index = draft.entries.findIndex((entry) => entry.at === at);
        if (index >= 0) draft.entries.splice(index, 1);
      });
    };
    element.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      element.removeEventListener('click', onClick);
    };
  },
  view: ({ data, setData, element }) => {
    const admin = element.classList.contains('is-admin');
    const frozen = Boolean(data.frozen);
    // view owns rendering — don't also set updateElement (playhtml forbids both).
    element.classList.toggle('is-frozen', frozen);

    const sign = (event: Event) => {
      event.preventDefault();
      if (frozen) return;
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
      <div class="admin-bar">
        <span>admin unlocked — delete appears on each note</span>
      </div>
      <div class="frozen-banner">signing is frozen — closed for now</div>
      <p>${data.entries.length} notes left</p>
      <form class="sign" @submit=${sign}>
        <input
          placeholder=${frozen ? 'signing frozen…' : 'leave a note...'}
          ?disabled=${frozen}
        />
        <button type="submit" ?disabled=${frozen}>sign</button>
      </form>
      <ul>
        ${repeat(
          [...data.entries].reverse(),
          (entry: GuestbookEntry) => html`
            <li>
              <div class="body">
                <b>${entry.name}</b>: ${entry.message}
                <small>${new Date(entry.at).toLocaleTimeString()}</small>
              </div>
              <button
                type="button"
                class="delete"
                data-delete-at=${entry.at}
                ?hidden=${!admin}
              >
                delete
              </button>
            </li>
          `,
        )}
      </ul>
      <p class="hint">
        unlock with <code>?admin</code> or <kbd>⌘⇧A</kbd> /
        <kbd>Ctrl⇧A</kbd>
      </p>
    `;
  },
};

export function GuestbookAdminDemo() {
  return (
    <CanPlayDemo
      elementId={WEEK4_GUESTBOOK_ID}
      styles={guestbookStyles(WEEK4_GUESTBOOK_ID)}
      init={guestbookInit}
    />
  );
}

// --- Password gate: unlocks a freeze-signing control on the guestbook ----------

const ROOM_PASSWORD = 'bench';
const PASSWORD_STORAGE_KEY = 'week4-password-unlocked';

function passwordLockStyles(id: string) {
  return `
  #${id} {
    font-family: var(--font-body);
    position: relative;
    width: min(100%, 18rem);
  }
  #${id} .panel {
    background: #f7f4ee;
    border-radius: 0.5rem;
    filter: blur(5px);
    padding: 0.85rem 0.9rem;
    transition: filter 0.25s ease;
    user-select: none;
  }
  #${id}.is-unlocked .panel {
    filter: none;
    user-select: auto;
  }
  #${id} .panel p {
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0 0 0.65rem;
  }
  #${id} .panel button {
    background: #eef2ff;
    border: 1px solid rgba(80, 100, 180, 0.4);
    border-radius: 0.35rem;
    color: #334;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.85rem;
    padding: 0.4rem 0.65rem;
  }
  #${id} .panel button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
  #${id} .status {
    display: block;
    font-size: 0.72rem;
    margin-top: 0.45rem;
    min-height: 1em;
    opacity: 0.65;
  }
  #${id} .gate {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.45rem;
    left: 50%;
    padding: 0.65rem 0.7rem;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: calc(100% - 1.5rem);
  }
  #${id}.is-unlocked .gate { display: none; }
  #${id} .gate p {
    font-size: 0.78rem;
    margin: 0 0 0.4rem;
    opacity: 0.7;
  }
  #${id} .gate form {
    display: flex;
    gap: 0.35rem;
  }
  #${id} .gate input {
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 0.35rem;
    flex: 1;
    font-family: inherit;
    font-size: 0.85rem;
    min-width: 0;
    padding: 0.35rem 0.45rem;
  }
  #${id} .gate button {
    background: #e8f5e9;
    border: 1px solid rgba(60, 179, 113, 0.45);
    border-radius: 0.35rem;
    color: #1b5e3a;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.8rem;
    padding: 0.35rem 0.55rem;
  }
  #${id} .gate .error {
    color: #a40000;
    font-size: 0.72rem;
    margin: 0.35rem 0 0;
    min-height: 1em;
  }
  #${id} .hint {
    font-size: 0.72rem;
    margin: 0.45rem 0 0;
    opacity: 0.55;
  }
`;
}

function getGuestbookHandle(): {
  getData?: () => GuestbookData;
  setData?: (next: GuestbookData | ((draft: GuestbookData) => void)) => void;
} | null {
  try {
    return playhtml.getHandle(WEEK4_GUESTBOOK_ID) as {
      getData?: () => GuestbookData;
      setData?: (next: GuestbookData | ((draft: GuestbookData) => void)) => void;
    };
  } catch {
    return null;
  }
}

function toggleGuestbookFrozen(): { ok: boolean; frozen?: boolean } {
  const handle = getGuestbookHandle();
  if (!handle?.setData || !handle.getData) return { ok: false };
  const next = !handle.getData().frozen;
  handle.setData((draft) => {
    draft.frozen = next;
  });
  return { ok: true, frozen: next };
}

function syncFreezeButton(element: HTMLElement): void {
  const button = element.querySelector<HTMLButtonElement>('[data-toggle-freeze]');
  if (!button) return;
  const frozen = Boolean(getGuestbookHandle()?.getData?.()?.frozen);
  button.textContent = frozen ? 'unfreeze signing' : 'freeze signing';
}

// Local-only unlock. The freeze control is in the DOM the whole time (blurred);
// the password just reveals it for this visitor. frozen itself is shared data.
const passwordLockInit: CanPlayInit<Record<string, never>> = {
  defaultData: {},
  onMount: ({ getElement, requestUpdate }) => {
    const element = getElement();

    const sync = () => {
      const unlocked =
        window.sessionStorage.getItem(PASSWORD_STORAGE_KEY) === '1';
      element.classList.toggle('is-unlocked', unlocked);
      requestUpdate();
      // Button label is imperatively synced — this element's shared data doesn't
      // change on freeze, so view() won't re-run from guestbook updates alone.
      window.setTimeout(() => syncFreezeButton(element), 0);
    };
    sync();

    const onSubmit = (event: Event) => {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      if (!form.matches('[data-password-form]')) return;
      const input = form.querySelector('input');
      const error = element.querySelector<HTMLElement>('.error');
      if (!input) return;
      if (input.value.trim() === ROOM_PASSWORD) {
        window.sessionStorage.setItem(PASSWORD_STORAGE_KEY, '1');
        if (error) error.textContent = '';
        sync();
      } else if (error) {
        error.textContent = 'nope — try again';
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.matches('[data-toggle-freeze]')) return;
      if (window.sessionStorage.getItem(PASSWORD_STORAGE_KEY) !== '1') return;
      const status = element.querySelector<HTMLElement>('.status');
      const result = toggleGuestbookFrozen();
      if (status) {
        status.textContent = result.ok
          ? result.frozen
            ? 'guestbook signing frozen for everyone'
            : 'guestbook open again'
          : 'guestbook not ready — try again in a moment';
      }
      if (result.ok) {
        target.textContent = result.frozen
          ? 'unfreeze signing'
          : 'freeze signing';
      }
    };

    element.addEventListener('submit', onSubmit);
    element.addEventListener('click', onClick);
    // Keep the label honest if freeze flips from elsewhere / after guestbook mounts.
    const pollId = window.setInterval(() => syncFreezeButton(element), 1000);
    return () => {
      element.removeEventListener('submit', onSubmit);
      element.removeEventListener('click', onClick);
      clearInterval(pollId);
    };
  },
  view: ({ element }) => {
    const unlocked = element.classList.contains('is-unlocked');
    const frozen = Boolean(getGuestbookHandle()?.getData?.()?.frozen);
    return html`
      <div class="panel" aria-hidden=${!unlocked}>
        <p>
          Closed for the night: freeze signing on the guestbook above. Notes
          stay; nobody can add new ones until you unfreeze.
        </p>
        <button type="button" data-toggle-freeze ?disabled=${!unlocked}>
          ${frozen ? 'unfreeze signing' : 'freeze signing'}
        </button>
        <span class="status"></span>
      </div>
      <div class="gate">
        <p>locked — enter the room password</p>
        <form data-password-form>
          <input type="password" placeholder="password" autocomplete="off" />
          <button type="submit">unlock</button>
        </form>
        <p class="error"></p>
      </div>
      <p class="hint">hint: the password is <code>${ROOM_PASSWORD}</code></p>
    `;
  },
};

export function PasswordLockDemo() {
  return (
    <CanPlayDemo
      elementId="week4-password-lock"
      styles={passwordLockStyles('week4-password-lock')}
      init={passwordLockInit}
    />
  );
}

// --- Shared elements: a porch lamp others can mirror ----------------------------

interface LampData {
  on: boolean;
}

function lampStyles(id: string) {
  return `
  #${id} {
    align-items: center;
    display: flex;
    flex-direction: column;
    font-family: var(--font-body);
    gap: 0.4rem;
    width: min(100%, 10rem);
  }
  #${id} button {
    background: #1a1a1a;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 50%;
    cursor: pointer;
    font-size: 2.4rem;
    height: 4.5rem;
    line-height: 1;
    transition: box-shadow 0.25s ease, background 0.25s ease;
    width: 4.5rem;
  }
  #${id}.is-on button {
    background: #fff6d6;
    box-shadow: 0 0 1.5rem rgba(255, 200, 60, 0.65);
  }
  #${id} .label {
    font-size: 0.8rem;
    opacity: 0.65;
  }
`;
}

const lampInit: CanPlayInit<LampData> = {
  defaultData: { on: false },
  updateElement: ({ element, data }) => {
    element.classList.toggle('is-on', data.on);
    const label = element.querySelector<HTMLElement>('.label');
    if (label) label.textContent = data.on ? 'on (shared)' : 'off (shared)';
  },
  onClick: (_event, { data, setData }) => {
    setData({ on: !data.on });
  },
};

export function SharedLampSourceDemo() {
  return (
    <CanPlayDemo
      elementId="week4-porch-lamp"
      shared
      skeleton={`<button type="button" aria-label="toggle porch lamp">💡</button><span class="label">off (shared)</span>`}
      styles={lampStyles('week4-porch-lamp')}
      init={lampInit}
    />
  );
}

// Same-page data-source consumers collide with the source id in one room, so this
// mirror just reads the source handle — a real other page would use data-source.
export function SharedLampConsumerDemo() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const tick = () => {
      try {
        const handle = playhtml.getHandle('week4-porch-lamp') as {
          getData?: () => LampData;
        };
        setOn(Boolean(handle.getData?.()?.on));
      } catch {
        // Source not mounted yet.
      }
    };
    tick();
    const id = window.setInterval(tick, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      id="week4-porch-lamp-mirror"
      className={on ? 'is-on' : undefined}
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body)',
        gap: '0.4rem',
        width: 'min(100%, 10rem)',
      }}
    >
      <style>{`
        #week4-porch-lamp-mirror button {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 50%;
          cursor: default;
          font-size: 2.4rem;
          height: 4.5rem;
          line-height: 1;
          transition: box-shadow 0.25s ease, background 0.25s ease;
          width: 4.5rem;
        }
        #week4-porch-lamp-mirror.is-on button {
          background: #fff6d6;
          box-shadow: 0 0 1.5rem rgba(255, 200, 60, 0.65);
        }
        #week4-porch-lamp-mirror .label {
          font-size: 0.8rem;
          opacity: 0.65;
        }
      `}</style>
      <button type="button" aria-label="mirrored porch lamp" tabIndex={-1}>
        💡
      </button>
      <span className="label">{on ? 'on (mirror)' : 'off (mirror)'}</span>
    </div>
  );
}

// --- Webring: one beacon per class page ----------------------------------------

// Each route publishes a uniquely-id'd shared beacon. Remote dots subscribe with
// dataSource using that same id (playhtml keys consumers by #fragment). The
// current page's dot reads the title orb via getHandle — a second dataSource to
// the same #id in this room would collide.

interface WebringMember {
  id: string;
  label: string;
  path: string;
  dataSource?: string;
  local?: boolean;
}

function discoverWeekNumbers(): number[] {
  return [0, 1, 2, 3, 4, 5];
}

function webringMembers(): WebringMember[] {
  const path =
    typeof window !== 'undefined' ? window.location.pathname : '/week/4';
  const pages: Array<{ id: string; label: string; path: string }> = [
    { id: 'home', label: 'home', path: '/' },
    ...discoverWeekNumbers().map((n) => ({
      id: `week-${n}`,
      label: `w${n}`,
      path: `/week/${n}`,
    })),
    { id: 'showcase', label: 'show', path: '/showcase' },
  ];

  return pages.map((page) => {
    const isLocal =
      page.path === '/'
        ? path === '/'
        : path === page.path || path.startsWith(`${page.path}/`);
    return {
      ...page,
      local: isLocal,
      dataSource: isLocal ? undefined : pageHomeBeaconDataSource(page.path),
    };
  });
}

function WebringOrbVisual({
  member,
  home,
}: {
  member: WebringMember;
  home: boolean;
}) {
  return (
    <div
      className={`week4-webring__orb${home ? ' is-home' : ''}`}
      title={member.path}
    >
      <span className="orb">
        <span className="dot" aria-hidden="true" />
      </span>
      <span className="name">{member.label}</span>
    </div>
  );
}

function WebringLocalOrb({ member }: { member: WebringMember }) {
  const beaconId = pageBeaconIdForPath(member.path);
  const [home, setHome] = useState(false);

  useEffect(() => {
    const tick = () => {
      try {
        const handle = playhtml.getHandle(beaconId) as {
          getData?: () => HomeBeaconData;
        };
        setHome(isHomeBeaconLive(handle.getData?.()?.lastSeen ?? 0));
      } catch {
        setHome(false);
      }
    };
    tick();
    const id = window.setInterval(tick, BEACON_FRESHNESS_POLL_MS);
    return () => clearInterval(id);
  }, [beaconId]);

  return <WebringOrbVisual member={member} home={home} />;
}

// Must use the beacon fragment as `id` so it matches data-source and getHandle.
const WebringRemoteOrb = withSharedState<
  HomeBeaconData,
  never,
  { member: WebringMember }
>(
  ({ member }) => ({
    defaultData: { lastSeen: 0 },
    id: pageBeaconIdForPath(member.path),
    dataSource: member.dataSource!,
    dataSourceReadOnly: true,
  }),
  ({ data, ref }, { member }) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
      const id = window.setInterval(
        () => setNow(Date.now()),
        BEACON_FRESHNESS_POLL_MS,
      );
      return () => clearInterval(id);
    }, []);

    const home = isHomeBeaconLive(data.lastSeen, now);

    return (
      <div
        ref={ref as RefObject<HTMLDivElement>}
        className={`week4-webring__orb${home ? ' is-home' : ''}`}
        title={member.path}
      >
        <span className="orb">
          <span className="dot" aria-hidden="true" />
        </span>
        <span className="name">{member.label}</span>
      </div>
    );
  },
);

function WebringMemberOrb({ member }: { member: WebringMember }) {
  if (member.local || !member.dataSource) {
    return (
      <div className="week4-webring__slot">
        <WebringLocalOrb member={member} />
      </div>
    );
  }

  return (
    <div className="week4-webring__slot">
      <WebringRemoteOrb member={member} />
    </div>
  );
}

export function WebringDemo() {
  const [members, setMembers] = useState<WebringMember[]>([]);

  useEffect(() => {
    setMembers(webringMembers());
  }, []);

  if (members.length === 0) return null;

  return (
    <div className="week4-webring">
      <div className="week4-webring__ring">
        {members.map((member) => (
          <WebringMemberOrb key={member.id} member={member} />
        ))}
      </div>
      <p className="week4-webring__caption">
        each dot is a class page — glow means someone is there
      </p>
      <style>{`
        .week4-webring {
          font-family: var(--font-body);
          width: min(100%, 22rem);
        }
        .week4-webring__ring {
          display: flex;
          flex-flow: row wrap;
          align-items: flex-start;
          gap: 0.55rem 0.65rem;
          justify-content: flex-start;
        }
        .week4-webring__slot {
          flex: 0 0 auto;
          width: 2.75rem;
        }
        .week4-webring__caption {
          font-size: 0.72rem;
          margin: 0.55rem 0 0;
          opacity: 0.55;
        }
        .week4-webring__orb {
          align-items: center;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          width: 2.75rem;
        }
        .week4-webring__orb .orb {
          align-items: center;
          background: #f0ebe3;
          border: 2px solid rgba(0, 0, 0, 0.08);
          border-radius: 50%;
          display: flex;
          height: 1.85rem;
          justify-content: center;
          opacity: 0.4;
          transition: opacity 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          width: 1.85rem;
        }
        .week4-webring__orb.is-home .orb {
          background: #7dffb0;
          border-color: rgba(60, 179, 113, 0.55);
          box-shadow: 0 0 0.7rem rgba(60, 179, 113, 0.55);
          opacity: 1;
        }
        .week4-webring__orb .dot {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 50%;
          height: 0.45rem;
          width: 0.45rem;
        }
        .week4-webring__orb.is-home .dot {
          background: #1b5e3a;
        }
        .week4-webring__orb .name {
          font-size: 0.62rem;
          opacity: 0.6;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
