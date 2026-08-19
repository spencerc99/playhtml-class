// ABOUTME: Live week 2 demos for can-mirror, basic JS, and a can-play preview.

import { useCallback } from 'react';
import { configureBunnyDemo } from './bunnyDemo';
import { LiveHtmlDemo } from './LiveHtmlDemo';

export const MIRROR_TEXTAREA_MAX_LENGTH = 1000;

export function ButtonClickDemo() {
  const onMount = useCallback((container: HTMLDivElement) => {
    const button = container.querySelector<HTMLButtonElement>('#my-button');

    if (!button) {
      return;
    }

    const handleClick = () => {
      alert('Button clicked!');
      button.textContent = 'Clicked!';
      button.style.backgroundColor = 'red';
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
<button id="my-button" type="button">Click me!!</button>
`}
      onMount={onMount}
    />
  );
}

export function BunnyMirrorDemo() {
  const configure = useCallback(configureBunnyDemo, []);

  return (
    <LiveHtmlDemo
      html={`
<style>
  .demo-bunny-mirror { width: 100%; }
  .demo-bunny-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: min(100%, 20rem);
  }
  .demo-bunny-buttons {
    display: flex;
    gap: 0.5rem;
  }
  #clone-bunny,
  #remove-bunny {
    background: #fff4d6;
    border: 1px solid rgba(247, 220, 156, 0.8);
    border-radius: 0.5rem;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.9rem;
    padding: 0.5rem 0.85rem;
  }
  #clone-bunny:disabled,
  #remove-bunny:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  [data-bunny-count] {
    align-self: center;
    font-size: 0.85rem;
  }
  [data-bunny-pen] {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    min-height: 4rem;
    width: 100%;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
  [data-bunny-pen] img {
    flex-shrink: 0;
    height: 4rem;
    object-fit: contain;
    width: 4rem;
  }
</style>
<div can-play id="bunny-demo" class="demo-bunny-mirror">
  <div class="demo-bunny-row">
    <div class="demo-bunny-buttons">
      <button id="clone-bunny" data-bunny-action="clone" type="button">clone bunny</button>
      <button id="remove-bunny" data-bunny-action="remove" type="button">remove bunny</button>
      <span data-bunny-count></span>
    </div>
    <div data-bunny-pen></div>
  </div>
</div>
`}
      configure={configure}
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
<textarea can-mirror id="text-area" maxlength="${MIRROR_TEXTAREA_MAX_LENGTH}" rows="4" placeholder="type something shared..."></textarea>
`}
    />
  );
}

export function MirrorColorDemo() {
  const onMount = useCallback((container: HTMLDivElement) => {
    const rectangle = container.querySelector<HTMLDivElement>('#color-rect');
    const button = container.querySelector<HTMLButtonElement>('#color-btn');

    if (!rectangle || !button) {
      return;
    }

    const handleClick = () => {
      const hue = Math.floor(Math.random() * 360);
      rectangle.style.background = `hsl(${hue}, 80%, 70%)`;
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
  #color-rect {
    background: #f3efe9;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 0.5rem;
    height: 6rem;
    transition: background 0.3s ease;
    width: min(100%, 16rem);
  }
  #color-btn {
    background: #fff4d6;
    border: 1px solid rgba(247, 220, 156, 0.8);
    border-radius: 0.5rem;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.9rem;
    margin-top: 0.75rem;
    padding: 0.5rem 0.85rem;
  }
</style>
<div can-mirror id="color-rect"></div>
<button id="color-btn" type="button">random color</button>
`}
      onMount={onMount}
    />
  );
}
