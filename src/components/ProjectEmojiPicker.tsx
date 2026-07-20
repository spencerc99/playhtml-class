// ABOUTME: Searchable emoji picker for a project's ring thumbnail fallback.
// ABOUTME: Loads the third-party picker only after the chooser is opened.

import type { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';
import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

interface ProjectEmojiPickerProps {
  onChange: (emoji: string) => void;
  value: string;
}

export function ProjectEmojiPicker({
  onChange,
  value,
}: ProjectEmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const chooseEmoji = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setIsOpen(false);
  };

  return (
    <div className="project-emoji-picker" ref={rootRef}>
      <button
        aria-label={`${isOpen ? 'Close' : 'Choose'} emoji. Selected ${value || '🪑'}`}
        aria-controls={pickerId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="project-emoji-picker__trigger"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <span className="project-emoji-picker__value" aria-hidden="true">
          {value || '🪑'}
        </span>
        <span className="project-emoji-picker__chevron" aria-hidden="true">
          {isOpen ? '↑' : '↓'}
        </span>
      </button>

      {isOpen ? (
        <div
          className="project-emoji-picker__popover"
          id={pickerId}
          role="dialog"
          aria-label="Choose an emoji"
        >
          <Suspense
            fallback={
              <div className="project-emoji-picker__loading" role="status">
                Gathering emoji…
              </div>
            }
          >
            <EmojiPicker
              autoFocusSearch
              emojiStyle={'native' as EmojiStyle}
              height={360}
              lazyLoadEmojis
              onEmojiClick={chooseEmoji}
              previewConfig={{ showPreview: false }}
              searchPlaceholder="Find an emoji…"
              theme={'light' as Theme}
              width="100%"
            />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}
