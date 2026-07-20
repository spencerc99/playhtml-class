// ABOUTME: Creates stable IDs and starter code for class-hosted shared stools.
// ABOUTME: Keeps the participant snippet and playground defaults in one place.

export interface ProjectSharedObject {
  css: string;
  html: string;
  id: string;
}

export const DEFAULT_SHARED_OBJECT_HTML =
  '<img src="/red-stool.png" alt="A red stool" />';
export const MAX_SHARED_HTML_LENGTH = 8_000;
export const MAX_SHARED_CSS_LENGTH = 12_000;

const SHARED_ID_PATTERN = /^[A-Za-z][\w.:-]{0,79}$/;

function slugify(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 36) || 'place'
  );
}

export function createSharedObjectId(
  label: string,
  unavailableIds: Iterable<string>,
): string {
  const unavailable = new Set(unavailableIds);
  let candidate = '';

  do {
    const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 8);
    candidate = `bench-${slugify(label)}-${suffix}`;
  } while (unavailable.has(candidate));

  return candidate;
}

export function fallbackSharedObjectId(projectId: string): string {
  const safeProjectId = projectId
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, 58);
  return `bench-${safeProjectId || 'place'}`;
}

export function normalizeSharedObjectId(
  value: unknown,
  projectId: string,
): string {
  return typeof value === 'string' && SHARED_ID_PATTERN.test(value)
    ? value
    : fallbackSharedObjectId(projectId);
}

export function defaultSharedObjectCss(sharedId: string): string {
  return `#${sharedId} {
  cursor: pointer;
  filter: drop-shadow(0 14px 12px rgba(81, 31, 20, 0.22));
  transition: filter 180ms ease, transform 180ms ease;
}

#${sharedId} img {
  display: block;
  height: auto;
  max-width: 100%;
}

#${sharedId}:hover,
#${sharedId}:focus-visible {
  filter: drop-shadow(0 18px 16px rgba(224, 0, 0, 0.3));
  transform: translateY(-6px) rotate(2deg);
}

#${sharedId}.toggled {
  filter: drop-shadow(0 0 24px rgba(224, 0, 0, 0.62));
  transform: rotate(-8deg) scale(1.14);
}`;
}

export function normalizeProjectSharedObject(
  value: unknown,
  projectId: string,
): ProjectSharedObject {
  const candidate =
    value && typeof value === 'object'
      ? (value as Partial<ProjectSharedObject>)
      : {};
  const id = normalizeSharedObjectId(candidate.id, projectId);

  return {
    id,
    html:
      typeof candidate.html === 'string'
        ? candidate.html.slice(0, MAX_SHARED_HTML_LENGTH)
        : DEFAULT_SHARED_OBJECT_HTML,
    css:
      typeof candidate.css === 'string'
        ? candidate.css.slice(0, MAX_SHARED_CSS_LENGTH)
        : defaultSharedObjectCss(id),
  };
}

export function sharedObjectDataSource(sharedId: string): string {
  return `class.playhtml.fun/playground#${sharedId}`;
}

export function sharedObjectConsumerSnippet(sharedId: string): string {
  return `<div
  data-source="${sharedObjectDataSource(sharedId)}"
  can-toggle
  can-play
>
  🪑
</div>

<script type="module">
  import { playhtml } from "https://unpkg.com/playhtml";
  playhtml.init();
</script>`;
}
