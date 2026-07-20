// ABOUTME: Loads the public webring embed after the class PlayHTML room is ready.
// ABOUTME: This keeps the class site and participant sites on the same widget code.

import { usePlayContext } from '@playhtml/react';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { getClassWebringScriptUrl } from '../lib/classWebringScript';

const EMBED_SCRIPT_ID = 'class-webring-embed-script';

export function ClassWebringEmbed() {
  const { isLoading } = usePlayContext();
  const location = useLocation();

  useEffect(() => {
    if (
      isLoading ||
      location.pathname === '/webring-demo' ||
      document.getElementById(EMBED_SCRIPT_ID)
    ) {
      return;
    }

    const script = document.createElement('script');
    script.id = EMBED_SCRIPT_ID;
    script.type = 'module';
    script.src = getClassWebringScriptUrl();
    document.body.append(script);
  }, [isLoading, location.pathname]);

  return null;
}
