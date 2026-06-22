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
  // <input type="color"> only understands #rrggbb. playhtml's auto-generated
  // identity color is hsl(), which the input can't display — fall back to the
  // default hex until the visitor picks a real color.
  const isHex = /^#[0-9a-fA-F]{6}$/.test(cursors.color ?? '');
  const color = isHex ? cursors.color : DEFAULT_COLOR;

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
