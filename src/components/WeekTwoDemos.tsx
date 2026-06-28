// ABOUTME: Live week 2 demos for can-duplicate, can-mirror, and basic JS.

import { playhtml } from '@playhtml/react';
import { useCallback } from 'react';
import { LiveHtmlDemo } from './LiveHtmlDemo';

const BUNNY_SRC = '/pixel-bunny.png';

export function ButtonClickDemo() {
  const onMount = useCallback((container: HTMLDivElement) => {
    const button = container.querySelector<HTMLButtonElement>('#my-button');

    if (!button) {
      return;
    }

    const handleClick = () => {
      alert('Button clicked!');
    };

    button.addEventListener('click', handleClick);

    return () => {
      button.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <LiveHtmlDemo
      html={`
<style>
  #my-button {
    background-color: blue;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
</style>
<button id="my-button" type="button">Click me</button>
`}
      onMount={onMount}
    />
  );
}

export function BunnyDuplicateDemo() {
  const onMount = useCallback((container: HTMLDivElement) => {
    const resetButton =
      container.querySelector<HTMLButtonElement>('#reset-btn');

    if (!resetButton) {
      return;
    }

    const handleReset = () => {
      // Clones get an id of the form "bunny-template-<random>", so match on that prefix.
      container
        .querySelectorAll<HTMLElement>("[id^='bunny-template-']")
        .forEach((element) => {
          playhtml.deleteElementData('can-duplicate', element.id);
          element.remove();
        });

      const cloneHandler = playhtml.elementHandlers
        .get('can-duplicate')
        ?.get('clone-btn');
      cloneHandler?.setData((draft: string[]) => {
        draft.splice(0, draft.length);
      });
    };

    resetButton.addEventListener('click', handleReset);

    return () => {
      resetButton.removeEventListener('click', handleReset);
    };
  }, []);

  return (
    <LiveHtmlDemo
      html={`
<style>
  .demo-bunny-duplicate { width: 100%; }
  .demo-bunny-row {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    width: 100%;
  }
  #clone-btn,
  #reset-btn {
    background: #fff4d6;
    border: 1px solid rgba(247, 220, 156, 0.8);
    border-radius: 0.5rem;
    cursor: pointer;
    flex-shrink: 0;
    font-family: var(--font-body);
    font-size: 0.9rem;
    padding: 0.5rem 0.85rem;
    white-space: nowrap;
  }
  #reset-btn {
    background: #f3efe9;
    border-color: rgba(0, 0, 0, 0.12);
  }
  #bunny-pen {
    display: flex;
    flex: 1;
    flex-direction: row;
    gap: 0.5rem;
    min-width: 0;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
  #bunny-pen img {
    flex-shrink: 0;
    height: 4rem;
    object-fit: contain;
    width: 4rem;
  }
</style>
<div class="demo-bunny-duplicate">
  <div class="demo-bunny-row">
    <button
      can-duplicate="bunny-template"
      can-duplicate-to="bunny-pen"
      id="clone-btn"
      type="button"
    >clone a bunny</button>
    <button id="reset-btn" type="button">reset</button>
    <div id="bunny-pen">
      <img id="bunny-template" src="${BUNNY_SRC}" alt="" />
    </div>
  </div>
</div>
`}
      onMount={onMount}
    />
  );
}

export function MirrorTextareaDemo() {
  return (
    <LiveHtmlDemo
      html={`
<style>
  #text-area {
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 0.5rem;
    font-family: var(--font-body);
    font-size: 0.95rem;
    line-height: 1.4;
    padding: 0.65rem 0.75rem;
    resize: vertical;
    width: min(100%, 16rem);
  }
</style>
<textarea can-mirror id="text-area" rows="4" placeholder="type something shared..."></textarea>
`}
    />
  );
}

export function MirrorGuestbookDemo() {
  const onMount = useCallback((container: HTMLDivElement) => {
    const guestbook =
      container.querySelector<HTMLUListElement>('#demo-guestbook');
    const addEntryButton =
      container.querySelector<HTMLButtonElement>('#demo-add-entry');

    if (!guestbook || !addEntryButton) {
      return;
    }

    const handleClick = () => {
      const newEntry = document.createElement('li');
      newEntry.textContent = 'new entry';
      newEntry.id = 'entry-' + (guestbook.children.length + 1);
      guestbook.appendChild(newEntry);
    };

    addEntryButton.addEventListener('click', handleClick);

    return () => {
      addEntryButton.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <LiveHtmlDemo
      html={`
<style>
  #demo-guestbook {
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 0.5rem;
    font-family: var(--font-body);
    font-size: 0.95rem;
    list-style: disc;
    margin: 0 0 0.75rem;
    padding: 0.5rem 0.75rem 0.5rem 1.75rem;
    width: min(100%, 16rem);
  }
  #demo-add-entry {
    background: #d7ecff;
    border: 1px solid rgba(44, 202, 255, 0.5);
    border-radius: 0.5rem;
    color: #1a6fa3;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.9rem;
    padding: 0.45rem 0.8rem;
  }
</style>
<ul can-mirror id="demo-guestbook">
  <li>first</li>
</ul>
<button id="demo-add-entry" type="button">add entry</button>
`}
      onMount={onMount}
    />
  );
}
