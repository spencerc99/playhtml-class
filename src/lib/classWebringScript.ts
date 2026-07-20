// ABOUTME: Resolves the class web-ring embed to the local dev server or public site.
// ABOUTME: Keeps preview and production consumers on the same script-loading path.

const PRODUCTION_WEBRING_SCRIPT = 'https://class.playhtml.fun/class-webring.js';

export function getClassWebringScriptUrl(): string {
  if (import.meta.env.DEV) {
    return new URL('/class-webring.js', window.location.origin).href;
  }

  return PRODUCTION_WEBRING_SCRIPT;
}
