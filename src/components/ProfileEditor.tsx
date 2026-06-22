// ABOUTME: Shared editor for the visitor's name + cursor color, bound to
// ABOUTME: playhtml's PlayerIdentity (localStorage + extension + live cursor).

import { usePlayContext } from '@playhtml/react';

const DEFAULT_COLOR = '#e00000';

// playhtml exposes reactive name/color setters on window.cursors; setting them
// persists to localStorage, updates the live cursor, and notifies React.
interface CursorGlobal {
  name?: string;
  color?: string;
}

function getCursorGlobal(): CursorGlobal | undefined {
  return (window as unknown as { cursors?: CursorGlobal }).cursors;
}

// <input type="color"> only accepts #rrggbb, but a cursor color may be any CSS
// color string — hsl() for the auto-generated anon identity, hex from the
// extension. Resolve whatever it is to hex via the browser's own color parser so
// the picker always reflects the visitor's actual current color.
function toHex(color: string): string | null {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color.toLowerCase();
  }
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) {
    return null;
  }
  // Probe with two sentinels: an invalid color leaves fillStyle unchanged, so if
  // both probes yield the same result the input was genuinely parsed (not stuck
  // on a sentinel).
  ctx.fillStyle = '#000000';
  ctx.fillStyle = color;
  const first = ctx.fillStyle;
  ctx.fillStyle = '#ffffff';
  ctx.fillStyle = color;
  const second = ctx.fillStyle;
  if (first !== second) {
    return null;
  }
  return /^#[0-9a-f]{6}$/.test(first) ? first : null;
}

interface ProfileEditorProps {
  nameLabel?: string;
  autoFocusName?: boolean;
}

export function ProfileEditor({
  nameLabel = 'Your name',
  autoFocusName = false,
}: ProfileEditorProps) {
  const { cursors, isProviderMissing } = usePlayContext();

  if (isProviderMissing) {
    return null;
  }

  const name = cursors.name ?? '';
  // Show the visitor's actual current color (extension hex or anon hsl default),
  // converted to hex for the picker; only fall back if it can't be parsed.
  const color = (cursors.color && toHex(cursors.color)) || DEFAULT_COLOR;

  const setName = (next: string) => {
    const global = getCursorGlobal();
    if (global) {
      global.name = next;
    }
  };

  const setColor = (next: string) => {
    const global = getCursorGlobal();
    // playhtml rejects an empty color; only write real values.
    if (global && next) {
      global.color = next;
    }
  };

  return (
    <div className="profile-editor">
      <label className="profile-editor__field">
        <span className="profile-editor__label">{nameLabel}</span>
        <input
          type="text"
          className="profile-editor__name"
          value={name}
          placeholder="who are you?"
          autoFocus={autoFocusName}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label className="profile-editor__field profile-editor__field--color">
        <span className="profile-editor__label">Cursor color</span>
        <input
          type="color"
          className="profile-editor__color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />
      </label>
    </div>
  );
}
