// ABOUTME: Week 0 communal guestbook — shared entries via playhtml, gated on the
// ABOUTME: visitor setting a name first (their playhtml profile identity).

import { usePlayContext, withSharedState } from '@playhtml/react';
import { useEffect, useState, type FormEvent, type RefObject } from 'react';
import { ProfileEditor } from './ProfileEditor';

interface GuestbookEntry {
  id: string;
  name: string;
  color: string;
  text: string;
  at: number;
}

const MAX_TEXT = 280;

function makeEntryId(): string {
  return Date.now().toString(36) + '-' + crypto.randomUUID().slice(0, 8);
}

function formatRelativeTime(fromMs: number, nowMs: number): string {
  const diffMs = Math.max(0, nowMs - fromMs);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'yesterday';
  return new Date(fromMs).toLocaleDateString();
}

export const Guestbook = withSharedState(
  { defaultData: { entries: [] as GuestbookEntry[] }, id: 'week0-guestbook' },
  ({ data, setData, ref }) => {
    // hasSynced flips true once playhtml loads shared state from the server.
    // Reading it here re-renders the component when a cold load's entries
    // arrive after mount, so existing notes show without needing a local edit.
    const { cursors, hasSynced } = usePlayContext();
    const [draft, setDraft] = useState('');
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
      const id = setInterval(() => setNow(Date.now()), 30_000);
      return () => clearInterval(id);
    }, []);

    const name = cursors.name?.trim();
    const color = cursors.color || '#e00000';

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = draft.trim();
      if (!trimmed || !name) {
        setDraft('');
        return;
      }
      const entry: GuestbookEntry = {
        id: makeEntryId(),
        name,
        color,
        text: trimmed.slice(0, MAX_TEXT),
        at: Date.now(),
      };
      setData((draftData: { entries: GuestbookEntry[] }) => {
        draftData.entries.push(entry);
      });
      setDraft('');
    };

    const entriesNewestFirst = [...data.entries].reverse();

    return (
      <section
        ref={ref as RefObject<HTMLElement>}
        id="week0-guestbook"
        className="guestbook"
      >
        <h2 className="guestbook__title">Sign the guestbook</h2>

        {name ? (
          <form className="guestbook__form" onSubmit={handleSubmit}>
            <p className="guestbook__signing-as">
              Signing as <strong style={{ color }}>{name}</strong>
            </p>
            <textarea
              className="guestbook__input"
              value={draft}
              maxLength={MAX_TEXT}
              placeholder="leave a note for the class…"
              rows={3}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" className="guestbook__submit">
              Sign
            </button>
          </form>
        ) : (
          <div className="guestbook__gate">
            <p className="guestbook__gate-message">
              Set your name to sign the guestbook.
            </p>
            <ProfileEditor autoFocusName />
          </div>
        )}

        <ul className="guestbook__entries">
          {entriesNewestFirst.length === 0 ? (
            <li className="guestbook__empty">
              {hasSynced
                ? 'No notes yet — be the first to sign!'
                : 'Loading notes…'}
            </li>
          ) : (
            entriesNewestFirst.map((entry) => (
              <li key={entry.id} className="guestbook__entry">
                <div className="guestbook__entry-head">
                  <span
                    className="guestbook__entry-name"
                    style={{ color: entry.color }}
                  >
                    {entry.name}
                  </span>
                  <time className="guestbook__entry-time">
                    {formatRelativeTime(entry.at, now)}
                  </time>
                </div>
                <p className="guestbook__entry-text">{entry.text}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    );
  },
);
