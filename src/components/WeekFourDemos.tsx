// ABOUTME: Live week 4 demos — soft admin gates on a guestbook, a shared-element
// ABOUTME: source, and a webring that treats recent shared heartbeats as "home".

import { html, playhtml, repeat } from 'playhtml';
import { useEffect, useState } from 'react';
import { CanPlayDemo, type CanPlayInit } from './CanPlayDemo';

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
  defaultData: { entries: [] },
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
      <div class="admin-bar">
        <span>admin unlocked — delete appears on each note</span>
      </div>
      <p>${data.entries.length} notes left</p>
      <form class="sign" @submit=${sign}>
        <input placeholder="leave a note..." />
        <button type="submit">sign</button>
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

// --- Password gate: unlocks a "clear everything" moderation control ------------

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
    background: #ffe0e0;
    border: 1px solid rgba(224, 0, 0, 0.35);
    border-radius: 0.35rem;
    color: #a40000;
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

function clearGuestbookEntries(): boolean {
  try {
    const handle = playhtml.getHandle(WEEK4_GUESTBOOK_ID) as {
      setData?: (next: GuestbookData | ((draft: GuestbookData) => void)) => void;
    };
    if (!handle?.setData) return false;
    handle.setData((draft) => {
      draft.entries.splice(0, draft.entries.length);
    });
    return true;
  } catch {
    return false;
  }
}

// Local-only unlock. The clear button is in the DOM the whole time (blurred);
// the password just reveals it for this visitor.
const passwordLockInit: CanPlayInit<Record<string, never>> = {
  defaultData: {},
  onMount: ({ getElement, requestUpdate }) => {
    const element = getElement();

    const sync = () => {
      const unlocked =
        window.sessionStorage.getItem(PASSWORD_STORAGE_KEY) === '1';
      element.classList.toggle('is-unlocked', unlocked);
      requestUpdate();
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
      if (!target.matches('[data-clear-all]')) return;
      if (window.sessionStorage.getItem(PASSWORD_STORAGE_KEY) !== '1') return;
      const status = element.querySelector<HTMLElement>('.status');
      const ok = clearGuestbookEntries();
      if (status) {
        status.textContent = ok
          ? 'cleared the guestbook above'
          : 'guestbook not ready — try again in a moment';
      }
    };

    element.addEventListener('submit', onSubmit);
    element.addEventListener('click', onClick);
    return () => {
      element.removeEventListener('submit', onSubmit);
      element.removeEventListener('click', onClick);
    };
  },
  view: ({ element }) => {
    const unlocked = element.classList.contains('is-unlocked');
    return html`
      <div class="panel" aria-hidden=${!unlocked}>
        <p>
          Danger zone: wipe every guestbook note for everyone. Soft-gated by a
          password in the page source.
        </p>
        <button type="button" data-clear-all ?disabled=${!unlocked}>
          clear everything
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

export function SharedLampConsumerDemo() {
  const [dataSource, setDataSource] = useState<string | null>(null);

  useEffect(() => {
    setDataSource(
      `${window.location.host}/week/4#week4-porch-lamp`,
    );
  }, []);

  if (!dataSource) return null;

  return (
    <CanPlayDemo
      elementId="week4-porch-lamp-mirror"
      dataSource={dataSource}
      dataSourceReadOnly
      skeleton={`<button type="button" aria-label="mirrored porch lamp">💡</button><span class="label">mirroring…</span>`}
      styles={lampStyles('week4-porch-lamp-mirror')}
      init={lampInit}
    />
  );
}

// --- Webring: live "home" via shared heartbeat + local awareness ----------------

// Awareness is room-local. Cross-site "someone is home" uses a shared element
// pulse: while the page is open we write lastSeen; the ring treats a recent
// pulse as home. When you leave, pulses stop and the glow fades out.
const HOME_MS = 12_000;
const PULSE_MS = 4_000;

interface HomeBeaconData {
  lastSeen: number;
}

interface HomePresence {
  here: boolean;
}

function homeBeaconStyles(id: string) {
  return `
  #${id} {
    font-family: var(--font-body);
    width: min(100%, 16rem);
  }
  #${id} .pulse {
    align-items: center;
    background: #f7f4ee;
    border-radius: 0.5rem;
    display: flex;
    gap: 0.6rem;
    padding: 0.55rem 0.7rem;
  }
  #${id} .dot {
    background: #bbb;
    border-radius: 50%;
    flex-shrink: 0;
    height: 0.75rem;
    transition: background 0.2s ease, box-shadow 0.2s ease;
    width: 0.75rem;
  }
  #${id}.is-home .dot {
    background: #3cb371;
    box-shadow: 0 0 0.6rem rgba(60, 179, 113, 0.7);
  }
  #${id} .copy {
    font-size: 0.85rem;
    line-height: 1.35;
  }
  #${id} .copy strong { font-weight: 600; }
  #${id} .meta {
    display: block;
    font-size: 0.72rem;
    margin-top: 0.15rem;
    opacity: 0.55;
  }
`;
}

const homeBeaconInit: CanPlayInit<HomeBeaconData, HomePresence> = {
  defaultData: { lastSeen: 0 },
  myDefaultAwareness: { here: true },
  onMount: ({ setData, getData, getElement }) => {
    const pulse = () => {
      setData((draft) => {
        draft.lastSeen = Date.now();
      });
    };
    const refreshHomeClass = () => {
      const data = getData();
      const home = data.lastSeen > 0 && Date.now() - data.lastSeen < HOME_MS;
      getElement().classList.toggle('is-home', home);
    };
    // Wait for sync so the first pulse isn't overwritten by hydration.
    let pulseId: ReturnType<typeof setInterval> | undefined;
    let refreshId: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;
    void playhtml.ready.then(() => {
      if (cancelled) return;
      window.setTimeout(() => {
        if (cancelled) return;
        pulse();
        pulseId = setInterval(pulse, PULSE_MS);
        refreshId = setInterval(refreshHomeClass, 2000);
      }, 700);
    });
    return () => {
      cancelled = true;
      if (pulseId) clearInterval(pulseId);
      if (refreshId) clearInterval(refreshId);
    };
  },
  updateElement: ({ element, data }) => {
    const home = data.lastSeen > 0 && Date.now() - data.lastSeen < HOME_MS;
    element.classList.toggle('is-home', home);
  },
  updateElementAwareness: ({ element, awareness }) => {
    const count = awareness.filter((entry) => entry?.here).length;
    const meta = element.querySelector<HTMLElement>('.meta');
    if (meta) {
      meta.textContent =
        count === 0
          ? 'pulsing while this page is open'
          : `${count} here right now · pulsing for the webring`;
    }
  },
};

export function HomeBeaconDemo() {
  return (
    <CanPlayDemo
      elementId="week4-home-beacon"
      shared
      skeleton={`
        <div class="pulse">
          <span class="dot" aria-hidden="true"></span>
          <div class="copy">
            <strong>this site</strong> is home
            <span class="meta">pulsing while this page is open</span>
          </div>
        </div>
      `}
      styles={homeBeaconStyles('week4-home-beacon')}
      init={homeBeaconInit}
    />
  );
}

interface WebringMember {
  id: string;
  label: string;
  // Favicon lookup domain. Empty → use a letter mark instead.
  domain: string;
  // If set, this circle mirrors a shared home-beacon via data-source.
  dataSource?: string;
  // Local page: glow from the beacon on this page (no extra consumer).
  local?: boolean;
}

function webringMembers(): WebringMember[] {
  const host = typeof window !== 'undefined' ? window.location.host : '';
  return [
    {
      id: 'class',
      label: 'class',
      domain: host,
      local: true,
      dataSource: host ? `${host}/week/4#week4-home-beacon` : undefined,
    },
    {
      id: 'playhtml',
      label: 'playhtml',
      domain: 'playhtml.fun',
      // Example remote source — stays dim unless that site publishes a beacon.
      dataSource: 'playhtml.fun#home-beacon',
    },
    {
      id: 'spencer',
      label: 'spencer',
      domain: 'spencer.place',
      dataSource: 'spencer.place#home-beacon',
    },
  ];
}

function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

function memberStyles(id: string) {
  return `
  #${id} {
    align-items: center;
    display: flex;
    flex-direction: column;
    font-family: var(--font-body);
    gap: 0.25rem;
    width: 3.5rem;
  }
  #${id} .orb {
    align-items: center;
    background: #f0ebe3;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 50%;
    display: flex;
    height: 2.75rem;
    justify-content: center;
    opacity: 0.45;
    transition: opacity 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    width: 2.75rem;
  }
  #${id}.is-home .orb {
    border-color: rgba(60, 179, 113, 0.55);
    box-shadow: 0 0 0.9rem rgba(60, 179, 113, 0.55);
    opacity: 1;
  }
  #${id} img {
    height: 1.25rem;
    width: 1.25rem;
  }
  #${id} .mark {
    font-size: 0.85rem;
    font-weight: 600;
    opacity: 0.7;
  }
  #${id} .name {
    font-size: 0.68rem;
    opacity: 0.6;
    text-align: center;
  }
`;
}

const remoteMemberInit: CanPlayInit<HomeBeaconData> = {
  defaultData: { lastSeen: 0 },
  // Pulses arrive every few seconds while someone is home; between pulses (and
  // after they leave) we still need to drop the glow once HOME_MS elapses.
  onMount: ({ getData, getElement }) => {
    const tick = () => {
      const data = getData();
      const home = data.lastSeen > 0 && Date.now() - data.lastSeen < HOME_MS;
      getElement().classList.toggle('is-home', home);
    };
    const id = setInterval(tick, 2000);
    tick();
    return () => clearInterval(id);
  },
  updateElement: ({ element, data }) => {
    const home = data.lastSeen > 0 && Date.now() - data.lastSeen < HOME_MS;
    element.classList.toggle('is-home', home);
  },
};

function WebringMemberOrb({ member }: { member: WebringMember }) {
  const elementId = `week4-webring-${member.id}`;

  // Local site: mirror the beacon on this page via data-source (same host/path).
  // Remote sites: same pattern — glow only if their shared beacon is pulsing.
  if (!member.dataSource) {
    return (
      <div className="week4-webring__slot" title={member.label}>
        <div className="week4-webring__fallback">
          <span className="orb">
            {member.domain ? (
              <img src={faviconUrl(member.domain)} alt="" />
            ) : (
              <span className="mark">{member.label[0]}</span>
            )}
          </span>
          <span className="name">{member.label}</span>
        </div>
      </div>
    );
  }

  return (
    <CanPlayDemo
      elementId={elementId}
      dataSource={member.dataSource}
      dataSourceReadOnly
      skeleton={`
        <div class="orb">
          ${
            member.domain
              ? `<img src="${faviconUrl(member.domain)}" alt="" />`
              : `<span class="mark">${member.label[0]}</span>`
          }
        </div>
        <span class="name">${member.label}</span>
      `}
      styles={memberStyles(elementId)}
      init={remoteMemberInit}
    />
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
        glow = someone is home (shared heartbeat within the last{' '}
        {HOME_MS / 1000}s)
      </p>
      <style>{`
        .week4-webring {
          font-family: var(--font-body);
          width: min(100%, 18rem);
        }
        .week4-webring__ring {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: flex-start;
        }
        .week4-webring__caption {
          font-size: 0.72rem;
          margin: 0.55rem 0 0;
          opacity: 0.55;
        }
        .week4-webring__fallback {
          align-items: center;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          width: 3.5rem;
        }
        .week4-webring__fallback .orb {
          align-items: center;
          background: #f0ebe3;
          border: 2px solid rgba(0, 0, 0, 0.08);
          border-radius: 50%;
          display: flex;
          height: 2.75rem;
          justify-content: center;
          opacity: 0.45;
          width: 2.75rem;
        }
        .week4-webring__fallback .name {
          font-size: 0.68rem;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
