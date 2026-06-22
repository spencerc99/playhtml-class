// ABOUTME: Per-week attendance wall — visitors click "I'm here" to check in, and
// ABOUTME: an expandable wall shows everyone's names in their colors, tilted.

import { usePlayContext, withSharedState } from '@playhtml/react';
import { useState, type RefObject } from 'react';
import { ProfileEditor } from './ProfileEditor';

const RaisedHandIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10m0 0V4a1.5 1.5 0 0 1 3 0v6m0 0V5a1.5 1.5 0 0 1 3 0v7m0-3.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.2-3l-2.3-4a1.5 1.5 0 0 1 2.6-1.5L7 11.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
    <path
      d="M5 13l4 4L19 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon = ({ up }: { up: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    style={{ transform: up ? 'rotate(180deg)' : undefined }}
  >
    <path
      d="M6 9l6 6 6-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
    <rect
      x="9"
      y="9"
      width="11"
      height="11"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M5 15V5a2 2 0 0 1 2-2h10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

interface Attendee {
  pid: string;
  name: string;
  color: string;
  at: number;
}

// Stable per-visitor fallback id when playhtml identity isn't ready yet.
let sessionFallbackId: string | null = null;
function getSessionFallbackId(): string {
  if (!sessionFallbackId) {
    sessionFallbackId = 'anon-' + crypto.randomUUID().slice(0, 12);
  }
  return sessionFallbackId;
}

// Deterministic tilt from the attendee id (stable across re-renders), scattered
// randomly: sign and magnitude both derive from the hash, biased to a visible
// 3–8° so nobody renders near-straight and the wall looks hand-pinned.
function tiltFor(pid: string): number {
  let hash = 0;
  for (let i = 0; i < pid.length; i++) {
    hash = (hash * 31 + pid.charCodeAt(i)) | 0;
  }
  const magnitude = 3 + (Math.abs(hash) % 500) / 100;
  const sign = (hash >> 9) & 1 ? 1 : -1;
  return magnitude * sign;
}

// The shared room is derived from the page URL (/week/N), so the same element id
// scopes to a separate attendance list per week automatically.
export const Attendance = withSharedState(
  { defaultData: { attendees: [] as Attendee[] }, id: 'week-attendance' },
  ({ data, setData, ref }) => {
    const { cursors, getMyPlayerIdentity, hasSynced } = usePlayContext();
    const [expanded, setExpanded] = useState(false);
    const [promptingName, setPromptingName] = useState(false);
    const [copied, setCopied] = useState(false);

    const attendees = data.attendees as Attendee[];
    const myPid = getMyPlayerIdentity()?.publicKey ?? getSessionFallbackId();
    const checkedIn = attendees.some((a) => a.pid === myPid);

    const checkIn = () => {
      const name = cursors.name?.trim();
      if (!name) {
        setPromptingName(true);
        return;
      }
      setPromptingName(false);
      const color = cursors.color || '#e00000';
      // Yjs draft only syncs push/splice, not in-place property assignment, so
      // replace an existing entry by splicing rather than mutating its fields.
      setData((draft: { attendees: Attendee[] }) => {
        const index = draft.attendees.findIndex((a) => a.pid === myPid);
        const entry: Attendee = { pid: myPid, name, color, at: Date.now() };
        if (index >= 0) {
          draft.attendees.splice(index, 1, entry);
        } else {
          draft.attendees.push(entry);
        }
      });
    };

    const copyAll = async () => {
      // name<TAB>Day h:mmam/pm — day-of-week makes the Mon/Tue section split
      // sortable in a spreadsheet.
      const text = attendees
        .map((a) => {
          const when = new Date(a.at).toLocaleString('en-US', {
            weekday: 'short',
            hour: 'numeric',
            minute: '2-digit',
          });
          return `${a.name}\t${when}`;
        })
        .join('\n');
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      } catch {
        setCopied(false);
      }
    };

    const count = attendees.length;

    return (
      <section
        ref={ref as RefObject<HTMLElement>}
        id="week-attendance"
        className="attendance"
      >
        <div className="attendance__bar">
          <button
            type="button"
            className={
              'attendance__checkin' +
              (checkedIn ? ' attendance__checkin--done' : '')
            }
            onClick={checkIn}
          >
            {checkedIn ? <CheckIcon /> : <RaisedHandIcon />}
            {checkedIn ? "you're here" : "i'm here"}
          </button>

          <button
            type="button"
            className="attendance__toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {count} here
            <ChevronIcon up={expanded} />
          </button>
        </div>

        {promptingName ? (
          <div className="attendance__name-prompt">
            <p className="attendance__name-message">
              Set your name to check in.
            </p>
            <ProfileEditor autoFocusName />
            <button
              type="button"
              className="attendance__name-confirm"
              onClick={checkIn}
            >
              Check in
            </button>
          </div>
        ) : null}

        <div
          className={
            'attendance__wall-panel' +
            (expanded ? '' : ' attendance__wall-panel--collapsed')
          }
          aria-hidden={!expanded}
        >
          <div className="attendance__wall-head">
            <span className="attendance__wall-count">
              {hasSynced ? `${count} here` : 'loading…'}
            </span>
            <button
              type="button"
              className="attendance__copy"
              onClick={copyAll}
              disabled={count === 0}
            >
              <CopyIcon />
              {copied ? 'copied' : 'copy all'}
            </button>
          </div>

          {count === 0 ? (
            <p className="attendance__empty">
              {hasSynced ? 'no one yet — be the first' : 'loading…'}
            </p>
          ) : (
            <div className="attendance__wall">
              {attendees.map((a) => (
                <span
                  key={a.pid}
                  className="attendance__name"
                  style={{
                    color: a.color,
                    transform: `rotate(${tiltFor(a.pid)}deg)`,
                  }}
                >
                  {a.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  },
);
