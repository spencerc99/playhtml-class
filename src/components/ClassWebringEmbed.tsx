// ABOUTME: Loads the public webring embed after the class PlayHTML room is ready.
// ABOUTME: This keeps the class site and participant sites on the same widget code.

import { usePlayContext } from '@playhtml/react';
import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { getClassWebringScriptUrl } from '../lib/classWebringScript';

const EMBED_SCRIPT_ID = 'class-webring-embed-script';
const REGISTRY_MODE_EVENT = 'class-webring:registry-mode';

export function ClassWebringEmbed() {
  const { isLoading } = usePlayContext();
  const location = useLocation();
  const embedHidden =
    location.pathname === '/playground' ||
    location.pathname === '/webring-demo';
  const registryMode =
    location.pathname === '/showcase'
      ? 'local'
      : embedHidden
        ? 'disabled'
        : 'remote';

  useLayoutEffect(() => {
    window.dispatchEvent(
      new CustomEvent(REGISTRY_MODE_EVENT, {
        detail: { mode: registryMode },
      }),
    );
  }, [registryMode]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      'class-webring-embed-hidden',
      embedHidden,
    );

    return () => {
      document.documentElement.classList.remove('class-webring-embed-hidden');
    };
  }, [embedHidden]);

  useEffect(() => {
    if (isLoading || embedHidden || document.getElementById(EMBED_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement('script');
    script.id = EMBED_SCRIPT_ID;
    script.type = 'module';
    script.src = getClassWebringScriptUrl();
    document.body.append(script);
  }, [embedHidden, isLoading]);

  return null;
}
