// ABOUTME: Profile control in the bottom nav — shows the visitor's name in their
// ABOUTME: cursor color and opens an upward popover to edit name + color.

import { usePlayContext } from '@playhtml/react';
import { useEffect, useRef, useState } from 'react';
import { ProfileEditor } from './ProfileEditor';

export function ProfilePill() {
  const { cursors, isProviderMissing } = usePlayContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (isProviderMissing) {
    return null;
  }

  const name = cursors.name?.trim();
  const color = cursors.color || '#e00000';

  return (
    <div ref={containerRef} className="profile-pill">
      {open ? (
        <div
          className="profile-pill__popover"
          role="dialog"
          aria-label="Profile"
        >
          <ProfileEditor autoFocusName={!name} />
        </div>
      ) : null}

      <button
        type="button"
        className="profile-pill__button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          className="profile-pill__dot"
          style={{ background: color }}
          aria-hidden="true"
        />
        {name ? name : 'set up profile'}
      </button>
    </div>
  );
}
