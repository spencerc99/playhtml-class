// ABOUTME: Creates stable IDs and starter code for class-hosted shared stools.
// ABOUTME: Keeps the participant snippet and playground defaults in one place.

export interface ProjectSharedObject {
  css: string;
  html: string;
  id: string;
}

interface ProjectAppearance {
  accentColor?: string;
  emoji?: string;
  imageUrl?: string;
  title: string;
  url: string;
}

export interface BuiltInRingProject {
  accentColor: string;
  description: string;
  emoji: string;
  id: string;
  imageUrl?: string;
  name: string;
  ringLabel: string;
  sharedObject: ProjectSharedObject;
  starterVersion: number;
  submittedAt: number;
  title: string;
  url: string;
}

export const DEFAULT_SHARED_OBJECT_HTML =
  '<img src="/red-stool.png" alt="A red stool" />';
export const MAX_SHARED_HTML_LENGTH = 8000;
export const MAX_SHARED_CSS_LENGTH = 12_000;

const SHARED_ID_PATTERN = /^[A-Za-z][\w.:-]{0,79}$/;

function escapeHtml(value: string): string {
  return value.replaceAll(/["&'<>]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

export function projectFaviconUrl(projectUrl: string): string | undefined {
  const normalizedUrl = safeHttpUrl(projectUrl);
  if (!normalizedUrl) return undefined;

  return new URL('/favicon.ico', normalizedUrl).href;
}

function slugify(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replaceAll(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replaceAll(/[^\da-z]+/g, '-')
      .replaceAll(/^-|-$/g, '')
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
  const safeProjectId = projectId.replaceAll(/[^\w-]/g, '').slice(0, 58);
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

export function createProjectAppearanceSharedObject(
  sharedId: string,
  appearance: ProjectAppearance,
): ProjectSharedObject {
  const emoji = escapeHtml(appearance.emoji?.trim().slice(0, 12) || '🪑');
  const faviconUrl = projectFaviconUrl(appearance.url);
  const imageUrl = safeHttpUrl(appearance.imageUrl);
  const title = escapeHtml(appearance.title.slice(0, 120));
  const accentColor =
    typeof appearance.accentColor === 'string' &&
    /^#[\da-f]{6}$/i.test(appearance.accentColor)
      ? appearance.accentColor
      : '#f05a47';
  const images = [
    imageUrl
      ? `<img class="starter-project-icon" src="${escapeHtml(imageUrl)}" alt="" onerror="this.remove()" />`
      : '',
    faviconUrl
      ? `<img class="starter-project-icon" src="${escapeHtml(faviconUrl)}" alt="" onerror="this.remove()" />`
      : '',
  ].join('');

  return {
    id: sharedId,
    html: `<div class="starter-project-appearance" aria-label="${title}"><span aria-hidden="true">${emoji}</span>${images}</div>`,
    css: `#${sharedId} {
  cursor: pointer;
  filter: drop-shadow(0 0.65em 0.55em color-mix(in srgb, ${accentColor} 36%, transparent));
  transition: filter 220ms ease, transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

#${sharedId} .starter-project-appearance {
  align-items: center;
  aspect-ratio: 1;
  display: flex;
  font-size: clamp(1.6rem, 5vw, 4.5rem);
  justify-content: center;
  position: relative;
  width: 72%;
}

#${sharedId} .starter-project-icon {
  height: 100%;
  inset: 0;
  object-fit: contain;
  position: absolute;
  width: 100%;
}

#${sharedId}:hover,
#${sharedId}:focus-visible {
  filter: drop-shadow(0 0.9em 0.7em color-mix(in srgb, ${accentColor} 55%, transparent));
  transform: translateY(-5%) rotate(4deg) scale(1.06);
}

#${sharedId}.toggled {
  filter: drop-shadow(0 0 1.15em color-mix(in srgb, ${accentColor} 72%, transparent));
  transform: rotate(-9deg) scale(1.14);
}`,
  };
}

function faviconSharedObjectCss(sharedId: string, accentColor: string): string {
  return `#${sharedId} {
  cursor: pointer;
  filter: drop-shadow(0 0.55em 0.45em color-mix(in srgb, ${accentColor} 20%, transparent));
  transition: filter 220ms ease, transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

#${sharedId} .starter-favicon {
  display: block;
  height: auto;
  width: 72%;
}

#${sharedId}:hover,
#${sharedId}:focus-visible {
  filter: drop-shadow(0 0.8em 0.6em color-mix(in srgb, ${accentColor} 36%, transparent));
  transform: translateY(-5%) rotate(4deg) scale(1.06);
}

#${sharedId}.toggled {
  filter: drop-shadow(0 0 1.1em color-mix(in srgb, ${accentColor} 58%, transparent));
  transform: rotate(-9deg) scale(1.14);
}`;
}

const WE_WERE_ONLINE_SHARED_OBJECT_HTML =
  '<img class="starter-favicon" src="/we-were-online-icon.png" alt="we were online icon" />';

const PLAYHTML_SHARED_OBJECT_HTML =
  '<img class="starter-favicon" src="https://playhtml.fun/icon.png" alt="PlayHTML favicon" />';

const WE_WERE_ONLINE_ACCENT_COLOR = '#806a52';
const PLAYHTML_ACCENT_COLOR = '#ffad42';
const BUILT_IN_STARTER_VERSION = 9;

const BUILT_IN_PROJECT_DEFINITIONS = [
  {
    id: 'builtin-class-site',
    sharedId: 'bench-class-site',
    name: 'Spencer Chang + Munus Shih',
    ringLabel: 'Class site',
    title: 'Building Benches for the Web',
    url: 'https://class.playhtml.fun/',
    description: 'The shared home for our class, projects, and weekly notes.',
    emoji: '🪑',
    accentColor: '#e00000',
    imageUrl: 'https://class.playhtml.fun/red-stool.png',
    html: DEFAULT_SHARED_OBJECT_HTML,
    css: defaultSharedObjectCss('bench-class-site'),
    submittedAt: -3,
  },
  {
    id: 'builtin-we-were-online',
    sharedId: 'bench-we-were-online',
    name: 'Spencer Chang',
    ringLabel: 'we were online',
    title: 'we were online',
    url: 'https://wewere.online/',
    description:
      'An online multiplayer world turning the existing Internet into a living, shared space.',
    emoji: '🌿',
    accentColor: WE_WERE_ONLINE_ACCENT_COLOR,
    imageUrl: 'https://class.playhtml.fun/we-were-online-icon.png',
    html: WE_WERE_ONLINE_SHARED_OBJECT_HTML,
    css: faviconSharedObjectCss(
      'bench-we-were-online',
      WE_WERE_ONLINE_ACCENT_COLOR,
    ),
    submittedAt: -2,
  },
  {
    id: 'builtin-playhtml',
    sharedId: 'bench-playhtml',
    name: 'Spencer Chang',
    ringLabel: 'PlayHTML',
    title: 'PlayHTML',
    url: 'https://playhtml.fun/',
    description: 'The playful library connecting all of these shared objects.',
    emoji: '🌐',
    accentColor: PLAYHTML_ACCENT_COLOR,
    imageUrl: 'https://playhtml.fun/icon.png',
    html: PLAYHTML_SHARED_OBJECT_HTML,
    css: faviconSharedObjectCss('bench-playhtml', PLAYHTML_ACCENT_COLOR),
    submittedAt: -1,
  },
] as const;

export function createBuiltInProjects(): Record<string, BuiltInRingProject> {
  return Object.fromEntries(
    BUILT_IN_PROJECT_DEFINITIONS.map((project) => [
      project.id,
      {
        id: project.id,
        name: project.name,
        ringLabel: project.ringLabel,
        title: project.title,
        url: project.url,
        description: project.description,
        emoji: project.emoji,
        accentColor: project.accentColor,
        imageUrl: 'imageUrl' in project ? project.imageUrl : undefined,
        starterVersion: BUILT_IN_STARTER_VERSION,
        submittedAt: project.submittedAt,
        sharedObject: {
          id: project.sharedId,
          html: project.html,
          css: project.css,
        },
      },
    ]),
  );
}

export function mergeBuiltInProjects<T extends { starterVersion?: number }>(
  projects: Record<string, T> | undefined,
): Record<string, BuiltInRingProject | T> {
  const builtIns = createBuiltInProjects();
  const merged: Record<string, BuiltInRingProject | T> = {
    ...builtIns,
    ...(projects ?? {}),
  };

  for (const [id, builtIn] of Object.entries(builtIns)) {
    const saved = projects?.[id];

    if (!saved || saved.starterVersion !== builtIn.starterVersion) {
      merged[id] = builtIn;
    }
  }

  return merged;
}

export function createBuiltInReservedIds(): Record<string, true> {
  return Object.fromEntries(
    BUILT_IN_PROJECT_DEFINITIONS.map((project) => [project.sharedId, true]),
  );
}

export function isBuiltInProjectId(projectId: string): boolean {
  return BUILT_IN_PROJECT_DEFINITIONS.some(
    (project) => project.id === projectId,
  );
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
  id="${sharedId}"
  data-source="${sharedObjectDataSource(sharedId)}"
  can-toggle
>
  🪑
</div>

<script type="module">
  import { playhtml } from "https://unpkg.com/playhtml";
  playhtml.init();
</script>`;
}
