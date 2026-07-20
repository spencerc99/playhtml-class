// ABOUTME: Creates stable IDs and starter code for class-hosted shared stools.
// ABOUTME: Keeps the participant snippet and playground defaults in one place.

export interface ProjectSharedObject {
  css: string;
  html: string;
  id: string;
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

function faviconSharedObjectCss(sharedId: string): string {
  return `#${sharedId} {
  cursor: pointer;
  filter: drop-shadow(0 0.55em 0.45em rgba(39, 75, 158, 0.2));
  transition: filter 220ms ease, transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

#${sharedId} .starter-favicon {
  border-radius: 22%;
  display: block;
  height: auto;
  width: 72%;
}

#${sharedId}:hover,
#${sharedId}:focus-visible {
  filter: drop-shadow(0 0.8em 0.6em rgba(39, 75, 158, 0.36));
  transform: translateY(-5%) rotate(4deg) scale(1.06);
}

#${sharedId}.toggled {
  filter: drop-shadow(0 0 1.1em rgba(39, 75, 158, 0.58));
  transform: rotate(-9deg) scale(1.14);
}`;
}

const DOCS_SHARED_OBJECT_HTML =
  '<img class="starter-favicon" src="https://playhtml.fun/docs/icon.png" alt="PlayHTML Docs favicon" />';

const PLAYHTML_SHARED_OBJECT_HTML =
  '<img class="starter-favicon" src="https://playhtml.fun/icon.png" alt="PlayHTML favicon" />';

const BUILT_IN_STARTER_VERSION = 6;

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
    id: 'builtin-playhtml-docs',
    sharedId: 'bench-playhtml-docs',
    name: 'Spencer Chang',
    ringLabel: 'Docs',
    title: 'PlayHTML Docs',
    url: 'https://playhtml.fun/docs/',
    description: 'Examples and references for every PlayHTML capability.',
    emoji: '📖',
    accentColor: '#274b9e',
    imageUrl: 'https://playhtml.fun/docs/icon.png',
    html: DOCS_SHARED_OBJECT_HTML,
    css: faviconSharedObjectCss('bench-playhtml-docs'),
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
    accentColor: '#ffad42',
    imageUrl: 'https://playhtml.fun/icon.png',
    html: PLAYHTML_SHARED_OBJECT_HTML,
    css: faviconSharedObjectCss('bench-playhtml'),
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
