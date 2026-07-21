// ABOUTME: Shared editor for the visitor's name + cursor color, bound to
// ABOUTME: playhtml's PlayerIdentity (localStorage + extension + live cursor).

import { usePlayContext } from '@playhtml/react';
import { colorToHex } from '../lib/color';

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

function setCursorName(name: string): void {
  const cursors = getCursorGlobal();
  if (cursors) {
    cursors.name = name;
  }
}

function setCursorColor(color: string): void {
  const cursors = getCursorGlobal();
  // playhtml rejects an empty color; only write real values.
  if (cursors && color) {
    cursors.color = color;
  }
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
  const color = (cursors.color && colorToHex(cursors.color)) || DEFAULT_COLOR;

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
          onChange={(event) => setCursorName(event.target.value)}
        />
      </label>

      <label className="profile-editor__field profile-editor__field--color">
        <span className="profile-editor__label">Cursor color</span>
        <input
          type="color"
          className="profile-editor__color"
          value={color}
          onChange={(event) => setCursorColor(event.target.value)}
        />
      </label>
    </div>
  );
}
