// ABOUTME: Full-viewport playground of class-hosted, participant-editable objects.
// ABOUTME: Projects render as sources or consumers using stable shared IDs.

import { CanPlayElement, playhtml } from '@playhtml/react';
import { TagType } from 'playhtml';
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  createProjectAppearanceSharedObject,
  DEFAULT_SHARED_OBJECT_HTML,
  defaultSharedObjectCss,
  isBuiltInProjectId,
  normalizeProjectSharedObject,
  projectFaviconUrl,
  sharedObjectConsumerSnippet,
  type ProjectSharedObject,
} from '../lib/projectSharedObject';

const ProjectCodeEditor = lazy(() => import('./ProjectCodeEditor'));

export interface RingProject {
  accentColor?: string;
  description?: string;
  emoji?: string;
  id: string;
  imageUrl?: string;
  name: string;
  ringLabel?: string;
  sharedObject?: ProjectSharedObject;
  starterVersion?: number;
  submittedAt: number;
  submittedBy?: string;
  title: string;
  toggleEffect?: ToggleEffect;
  url: string;
}

export type ToggleEffect = 'bounce' | 'glow' | 'spin' | 'tilt';

interface ProjectWebringProps {
  demo?: boolean;
  embedded?: boolean;
  hasSynced: boolean;
  onEditProjectDetails?: (project: RingProject) => void;
  onUpdateProject?: (
    projectId: string,
    patch: Partial<Pick<ProjectSharedObject, 'css' | 'html'>>,
  ) => void;
  playerId?: string;
  projects: RingProject[];
  sourceObjects?: boolean;
}

type SharedObjectCode = Pick<ProjectSharedObject, 'css' | 'html'>;

interface PreviewOverride extends SharedObjectCode {
  projectId: string;
}

const FALLBACK_COLORS = [
  '#f05a47',
  '#ffad42',
  '#7eae72',
  '#61a8bf',
  '#8976c9',
  '#df72a2',
];
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.75;
const ZOOM_STEP = 0.25;
const TOGGLE_EFFECTS: ToggleEffect[] = ['tilt', 'spin', 'bounce', 'glow'];

function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function safeText(value: unknown, maxLength: number, fallback = ''): string {
  return typeof value === 'string' ? value.slice(0, maxLength) : fallback;
}

function safeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)
    ? value
    : fallback;
}

function safeToggleEffect(value: unknown, projectId: string): ToggleEffect {
  if (TOGGLE_EFFECTS.includes(value as ToggleEffect)) {
    return value as ToggleEffect;
  }

  let hash = 0;
  for (const character of projectId) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }
  return TOGGLE_EFFECTS[hash % TOGGLE_EFFECTS.length];
}

function relativeLuminance([red, green, blue]: [
  number,
  number,
  number,
]): number {
  const linearChannels = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.040_45
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return (
    linearChannels[0] * 0.2126 +
    linearChannels[1] * 0.7152 +
    linearChannels[2] * 0.0722
  );
}

function contrastSafeAccent(accent: string): string {
  const channels: [number, number, number] = [
    Number.parseInt(accent.slice(1, 3), 16),
    Number.parseInt(accent.slice(3, 5), 16),
    Number.parseInt(accent.slice(5, 7), 16),
  ];

  if (1.05 / (relativeLuminance(channels) + 0.05) >= 4.5) return accent;

  let lowerScale = 0;
  let upperScale = 1;
  for (let iteration = 0; iteration < 8; iteration += 1) {
    const scale = (lowerScale + upperScale) / 2;
    const contrast =
      1.05 /
      (relativeLuminance(
        channels.map((channel) => channel * scale) as [number, number, number],
      ) +
        0.05);

    if (contrast >= 4.5) lowerScale = scale;
    else upperScale = scale;
  }

  return `#${channels
    .map((channel) => Math.round(channel * lowerScale))
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

function prioritizeProjectImage(html: string, imageUrl: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  const appearance = template.content.querySelector(
    '.starter-project-appearance',
  );
  const image = [
    ...(appearance?.querySelectorAll('.starter-project-icon') ?? []),
  ].find((candidate) => candidate.getAttribute('src') === imageUrl);

  if (!appearance || !image || image === appearance.lastElementChild) {
    return html;
  }

  appearance.append(image);
  return template.innerHTML;
}

function safeProjects(projects: RingProject[]): RingProject[] {
  return projects.flatMap((project, index) => {
    if (!project || typeof project !== 'object') return [];

    const url = safeHttpUrl(project.url);
    const title = safeText(project.title, 120);
    if (!url || !title) return [];

    const id = safeText(project.id, 100, `project-${index}`);
    const imageUrl = safeHttpUrl(project.imageUrl);

    const normalizedSharedObject = normalizeProjectSharedObject(
      project.sharedObject,
      id,
    );
    const faviconUrl = projectFaviconUrl(url);
    const starterSharedObject =
      faviconUrl &&
      normalizedSharedObject.html.includes('starter-project-appearance')
        ? {
            ...normalizedSharedObject,
            html: normalizedSharedObject.html.replaceAll(
              /https:\/\/icons\.duckduckgo\.com\/ip3\/[^\s"'<>]+\.ico/g,
              faviconUrl,
            ),
          }
        : normalizedSharedObject;
    const prioritizedSharedObject =
      imageUrl &&
      starterSharedObject.html.includes('starter-project-appearance')
        ? {
            ...starterSharedObject,
            html: prioritizeProjectImage(starterSharedObject.html, imageUrl),
          }
        : starterSharedObject;
    const sharedObject =
      !isBuiltInProjectId(id) &&
      prioritizedSharedObject.html === DEFAULT_SHARED_OBJECT_HTML
        ? createProjectAppearanceSharedObject(prioritizedSharedObject.id, {
            accentColor: project.accentColor,
            emoji: project.emoji,
            imageUrl: imageUrl ?? undefined,
            title,
            url,
          })
        : prioritizedSharedObject;

    return [
      {
        id,
        name: safeText(project.name, 80, 'someone'),
        ringLabel: safeText(project.ringLabel, 80) || undefined,
        title,
        url,
        description: safeText(project.description, 240) || undefined,
        emoji: safeText(project.emoji, 12, '🪑'),
        accentColor: safeColor(
          project.accentColor,
          FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        ),
        imageUrl: imageUrl ?? undefined,
        submittedAt:
          typeof project.submittedAt === 'number' ? project.submittedAt : index,
        submittedBy: safeText(project.submittedBy, 180) || undefined,
        sharedObject,
        toggleEffect: safeToggleEffect(project.toggleEffect, id),
      },
    ];
  });
}

function projectHostname(projectUrl: string): string {
  try {
    return new URL(projectUrl).hostname.replace(/^www\./, '');
  } catch {
    return projectUrl;
  }
}

function projectObjectDataSource(sharedId: string): string {
  return `${window.location.host}/showcase#${sharedId}`;
}

interface OrbitTrack {
  horizontalRadius: number;
  itemCount: number;
  verticalRadius: number;
}

function orbitTracks(total: number): OrbitTrack[] {
  const orbitCount = Math.min(3, Math.ceil(total / 16));
  const outerRadius = 48;
  const horizontalInnerRadius = orbitCount === 1 ? outerRadius : 31;
  const verticalInnerRadius = orbitCount === 1 ? outerRadius : 36;
  const tracks = Array.from({ length: orbitCount }, (_, index) => {
    const progress = orbitCount === 1 ? 0 : index / (orbitCount - 1);
    const horizontalRadius =
      outerRadius - progress * (outerRadius - horizontalInnerRadius);
    const verticalRadius =
      outerRadius - progress * (outerRadius - verticalInnerRadius);

    return {
      horizontalRadius,
      itemCount: 0,
      verticalRadius,
    };
  });
  const weights = tracks.map(
    (track) => (track.horizontalRadius + track.verticalRadius) / 2,
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const rawCounts = weights.map((weight) => (total * weight) / totalWeight);

  for (const [index, rawCount] of rawCounts.entries()) {
    tracks[index].itemCount = Math.floor(rawCount);
  }

  const assignedCount = tracks.reduce((sum, track) => sum + track.itemCount, 0);
  const remainderOrder = rawCounts
    .map((rawCount, index) => ({
      fraction: rawCount - Math.floor(rawCount),
      index,
    }))
    .sort(
      (left, right) =>
        right.fraction - left.fraction || left.index - right.index,
    );

  for (let index = 0; index < total - assignedCount; index += 1) {
    tracks[remainderOrder[index].index].itemCount += 1;
  }

  if (tracks.length === 2 && tracks[0].itemCount > 17) {
    const overflow = tracks[0].itemCount - 17;
    tracks[0].itemCount -= overflow;
    tracks[1].itemCount += overflow;
  }

  return tracks;
}

function orbitPosition(index: number, total: number): CSSProperties {
  const tracks = orbitTracks(total);
  let itemsBeforeOrbit = 0;
  let orbitIndex = 0;
  let track = tracks[0];

  for (; orbitIndex < tracks.length; orbitIndex += 1) {
    track = tracks[orbitIndex];
    if (index < itemsBeforeOrbit + track.itemCount) break;
    itemsBeforeOrbit += track.itemCount;
  }

  const itemIndex = index - itemsBeforeOrbit;
  const angleOffset = orbitIndex === 0 ? 0 : Math.PI / track.itemCount;
  const angle =
    (itemIndex / Math.max(track.itemCount, 1)) * Math.PI * 2 -
    Math.PI / 2 +
    angleOffset;
  const isLowerHalf = Math.sin(angle) > 0;

  return {
    '--ring-x': `${50 + Math.cos(angle) * track.horizontalRadius}%`,
    '--ring-y': `${50 + Math.sin(angle) * track.verticalRadius}%`,
    '--ring-delay': `${index * -0.12}s`,
    '--ring-drift-delay': `${index * -1.7}s`,
    '--ring-drift-duration': `${18 + (index % 7) * 1.35}s`,
    '--ring-drift-x': `${0.28 + (index % 4) * 0.07}rem`,
    '--ring-drift-y': `${0.32 + ((index + 2) % 4) * 0.08}rem`,
    '--ring-label-bottom': isLowerHalf ? 'auto' : 'calc(100% + 0.35rem)',
    '--ring-label-top': isLowerHalf ? 'calc(100% + 0.35rem)' : 'auto',
  } as CSSProperties;
}

function ringSizing(total: number): CSSProperties {
  const density = Math.max(0.42, Math.min(1, 15 / Math.max(total, 1)));
  const desktopMinimum = Math.max(3, 5.75 * density);
  const mobileMinimum = Math.max(2.25, 3.25 * density);

  return {
    '--ring-label-width': `${Math.max(7, 12 * density).toFixed(2)}rem`,
    '--ring-mobile-label-width': `${Math.max(4.5, 5.25 * density).toFixed(2)}rem`,
    '--ring-mobile-node-size': `clamp(${mobileMinimum.toFixed(2)}rem, ${(15 * density).toFixed(2)}vw, ${(5 * density).toFixed(2)}rem)`,
    '--ring-node-size': `clamp(${desktopMinimum.toFixed(2)}rem, ${(7.5 * density).toFixed(2)}vw, ${(8.5 * density).toFixed(2)}rem)`,
  } as CSSProperties;
}

function ObjectMarkup({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html;
  }, [html]);

  return <div className="project-webring__node-markup" ref={ref} />;
}

function ObjectNode({
  demo,
  project,
  sourceObject,
}: {
  demo: boolean;
  project: RingProject;
  sourceObject: boolean;
}) {
  const sharedObject = project.sharedObject!;
  const [isToggled, setIsToggled] = useState(false);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;

    void playhtml.ready.then(() => {
      const element = document.getElementById(sharedObject.id);
      if (!cancelled && element) {
        return playhtml.setupPlayElementForTag(element, TagType.CanToggle);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [demo, sharedObject.id]);

  useEffect(() => {
    const element = document.getElementById(sharedObject.id);
    if (!element) return;

    const reflectToggleState = () => {
      setIsToggled(element.classList.contains('toggled'));
    };
    const observer = new MutationObserver(reflectToggleState);
    observer.observe(element, {
      attributeFilter: ['class'],
      attributes: true,
    });
    reflectToggleState();

    return () => observer.disconnect();
  }, [sharedObject.id]);

  const node = (
    <div
      className={`project-webring__node project-webring__node--toggle-${project.toggleEffect ?? 'tilt'}`}
      id={sharedObject.id}
      role="button"
      tabIndex={0}
      aria-label={`Toggle ${project.title} by ${project.name}`}
      aria-pressed={isToggled}
      // eslint-disable-next-line react/no-unknown-property -- PlayHTML capability attribute.
      can-toggle=""
      onClick={
        demo
          ? (event) => {
              event.currentTarget.classList.toggle('toggled');
            }
          : undefined
      }
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
      onDoubleClick={(event) => {
        event.preventDefault();
        window.open(project.url, '_blank', 'noopener,noreferrer');
      }}
    >
      <ObjectMarkup html={sharedObject.html} />
    </div>
  );

  return (
    <>
      <style>{sharedObject.css}</style>
      {demo ? (
        node
      ) : sourceObject ? (
        <CanPlayElement<Record<string, unknown>>
          defaultData={{}}
          id={sharedObject.id}
          shared="read-write"
        >
          {() => node}
        </CanPlayElement>
      ) : (
        <CanPlayElement<Record<string, unknown>>
          dataSource={projectObjectDataSource(sharedObject.id)}
          defaultData={{}}
          id={sharedObject.id}
        >
          {() => node}
        </CanPlayElement>
      )}
    </>
  );
}

export function ProjectWebring({
  demo = false,
  embedded = false,
  hasSynced,
  onEditProjectDetails,
  onUpdateProject,
  playerId,
  projects,
  sourceObjects = false,
}: ProjectWebringProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorDraft, setEditorDraft] = useState<SharedObjectCode | null>(null);
  const [savedCode, setSavedCode] = useState<SharedObjectCode | null>(null);
  const [previewOverride, setPreviewOverride] =
    useState<PreviewOverride | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editorStatus, setEditorStatus] = useState(
    'Edit your draft, then preview it before saving.',
  );
  const [copyStatus, setCopyStatus] = useState('Copy connection code');
  const safeRingProjects = useMemo(() => safeProjects(projects), [projects]);
  const displayedRingProjects = useMemo(
    () =>
      previewOverride
        ? safeRingProjects.map((project) =>
            project.id === previewOverride.projectId && project.sharedObject
              ? {
                  ...project,
                  sharedObject: {
                    ...project.sharedObject,
                    css: previewOverride.css,
                    html: previewOverride.html,
                  },
                }
              : project,
          )
        : safeRingProjects,
    [previewOverride, safeRingProjects],
  );
  const selected =
    safeRingProjects.find((project) => project.id === selectedId) ?? null;
  const editing =
    safeRingProjects.find((project) => project.id === editingId) ?? null;
  const hasDraftChanges = Boolean(
    editorDraft &&
    savedCode &&
    (editorDraft.html !== savedCode.html || editorDraft.css !== savedCode.css),
  );
  const isCurrentDraftPreviewed = Boolean(
    editorDraft &&
    previewOverride &&
    previewOverride.projectId === editingId &&
    previewOverride.html === editorDraft.html &&
    previewOverride.css === editorDraft.css,
  );
  const selectedIsBuiltIn = Boolean(
    selected && isBuiltInProjectId(selected.id),
  );
  const ownsSelected = Boolean(
    !embedded &&
    selected &&
    !selectedIsBuiltIn &&
    playerId &&
    selected.submittedBy === playerId,
  );
  const canEditSelected = ownsSelected && Boolean(onUpdateProject);
  const webringSizing = ringSizing(safeRingProjects.length);

  const changeZoom = (amount: number) => {
    setZoom((current) =>
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + amount)),
    );
  };

  useEffect(() => {
    if (
      selectedId &&
      !safeRingProjects.some((project) => project.id === selectedId)
    ) {
      setSelectedId(null);
    }
    if (
      editingId &&
      !safeRingProjects.some((project) => project.id === editingId)
    ) {
      setEditingId(null);
      setEditorDraft(null);
      setSavedCode(null);
      setPreviewOverride(null);
      setIsPreviewMode(false);
    }
  }, [editingId, safeRingProjects, selectedId]);

  useEffect(() => {
    setCopyStatus('Copy connection code');
  }, [editingId]);

  const beginEditing = (project: RingProject) => {
    if (!project.sharedObject) return;

    const code = {
      css: project.sharedObject.css,
      html: project.sharedObject.html,
    };
    setEditingId(project.id);
    setEditorDraft(code);
    setSavedCode(code);
    setPreviewOverride(null);
    setIsPreviewMode(false);
    setEditorStatus('Edit your draft, then preview it before saving.');
  };

  const closeEditor = () => {
    if (
      hasDraftChanges &&
      !window.confirm('Discard the HTML and CSS changes in this draft?')
    )
      return;

    setEditingId(null);
    setEditorDraft(null);
    setSavedCode(null);
    setPreviewOverride(null);
    setIsPreviewMode(false);
  };

  const updateDraft = (language: 'css' | 'html', value: string) => {
    setEditorDraft((current) =>
      current ? { ...current, [language]: value } : current,
    );
    setPreviewOverride(null);
    setIsPreviewMode(false);
    setEditorStatus('Draft changed — preview it before saving.');
  };

  const previewDraft = () => {
    if (!editing || !editorDraft || !hasDraftChanges) return;

    setPreviewOverride({ projectId: editing.id, ...editorDraft });
    setIsPreviewMode(true);
    setEditorStatus('Previewing locally. Save to publish these changes.');
  };

  const saveDraft = () => {
    if (
      !editing ||
      !editorDraft ||
      !onUpdateProject ||
      !hasDraftChanges ||
      !isCurrentDraftPreviewed
    )
      return;

    onUpdateProject(editing.id, editorDraft);
    setSavedCode({ ...editorDraft });
    setIsPreviewMode(false);
    setEditorStatus('Saved to the shared class registry.');
  };

  const resetSharedObject = () => {
    if (!editing?.sharedObject || !editorDraft) return;
    if (
      !window.confirm(
        'Load the red stool into this draft? Preview and save it afterward.',
      )
    )
      return;

    setEditorDraft({
      html: DEFAULT_SHARED_OBJECT_HTML,
      css: defaultSharedObjectCss(editing.sharedObject.id),
    });
    setPreviewOverride(null);
    setIsPreviewMode(false);
    setEditorStatus(
      'Red stool loaded into the draft — preview it before saving.',
    );
  };

  const copyConnectionCode = async () => {
    if (!editing?.sharedObject) return;

    try {
      await navigator.clipboard.writeText(
        sharedObjectConsumerSnippet(editing.sharedObject.id),
      );
      setCopyStatus('Copied!');
    } catch {
      setCopyStatus('Select and copy the code below');
    }
  };

  return (
    <div
      className={`project-webring${selected ? ' project-webring--expanded' : ''}${
        editing ? ' project-webring--editing' : ''
      }${isPreviewMode ? ' project-webring--previewing' : ''}${
        safeRingProjects.length > 24 ? ' project-webring--dense' : ''
      }${safeRingProjects.length > 10 ? ' project-webring--multi-orbit' : ''}`}
      aria-label="Class project playground"
      aria-busy={!hasSynced}
    >
      <div className="project-webring__viewport">
        <div
          className="project-webring__canvas-extent"
          style={
            {
              height: `${Math.max(zoom, 1) * 100}svh`,
              width: `${Math.max(zoom, 1) * 100}vw`,
            } as CSSProperties
          }
        >
          <div
            className="project-webring__canvas"
            style={
              {
                ...webringSizing,
                left: zoom < 1 ? `${(1 - zoom) * 50}vw` : 0,
                top: zoom < 1 ? `${(1 - zoom) * 50}svh` : 0,
                '--ring-zoom': zoom,
              } as CSSProperties
            }
          >
            <div className="project-webring__wash" aria-hidden="true" />
            {!hasSynced ? (
              <div
                className="project-webring__empty project-webring__loading"
                role="status"
              >
                <div className="project-webring__loading-visual">
                  <img src="/red-stool.png" alt="" />
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                </div>
                <h2>Gathering the stools…</h2>
                <p>Loading the shared class collection from PlayHTML.</p>
              </div>
            ) : safeRingProjects.length === 0 ? (
              <div className="project-webring__empty">
                <img src="/red-stool.png" alt="" />
                <h2>Take the first seat</h2>
                <p>
                  The first submission will place a red stool in this shared
                  room.
                </p>
              </div>
            ) : (
              <>
                <ol className="project-webring__orbit">
                  {displayedRingProjects.map((project, index) => {
                    const accent =
                      project.accentColor ??
                      FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                    const nodeStyle = {
                      ...orbitPosition(index, safeRingProjects.length),
                      '--ring-accent': accent,
                      '--ring-ui-accent': contrastSafeAccent(accent),
                    } as CSSProperties;

                    return (
                      <li
                        className={`project-webring__item${
                          selectedId === project.id ? ' is-selected' : ''
                        }`}
                        key={project.id}
                        style={nodeStyle}
                      >
                        <div className="project-webring__drifter">
                          <ObjectNode
                            demo={demo}
                            project={project}
                            sourceObject={sourceObjects}
                          />
                          <button
                            aria-controls="project-webring-detail"
                            aria-expanded={selectedId === project.id}
                            className="project-webring__node-label"
                            onClick={() => setSelectedId(project.id)}
                            title={project.ringLabel ?? project.title}
                            type="button"
                          >
                            {project.ringLabel ?? project.title}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <div className="project-webring__center" aria-live="polite">
                  {selected ? (
                    <article
                      className="project-webring__detail"
                      id="project-webring-detail"
                      style={
                        {
                          '--ring-accent': selected.accentColor ?? '#e00000',
                          '--ring-ui-accent': contrastSafeAccent(
                            selected.accentColor ?? '#e00000',
                          ),
                        } as CSSProperties
                      }
                    >
                      <button
                        className="project-webring__close"
                        type="button"
                        onClick={() => setSelectedId(null)}
                        aria-label="Close project details"
                      >
                        ×
                      </button>
                      <p className="project-webring__detail-kicker">
                        {selected.name}
                      </p>
                      <h2>{selected.title}</h2>
                      {selected.description ? (
                        <p>{selected.description}</p>
                      ) : null}
                      <a href={selected.url} target="_blank" rel="noreferrer">
                        Enter {projectHostname(selected.url)}{' '}
                        <span aria-hidden="true">↗</span>
                      </a>
                      {ownsSelected ? (
                        <div className="project-webring__owner-controls">
                          <p className="project-webring__owner-label">
                            <strong>
                              {selectedIsBuiltIn
                                ? 'Class controls'
                                : 'Owner controls'}
                            </strong>
                            {selectedIsBuiltIn ? null : (
                              <span>Only visible to you</span>
                            )}
                          </p>
                          <div>
                            {canEditSelected ? (
                              <button
                                className="project-webring__edit-object"
                                type="button"
                                onClick={() => beginEditing(selected)}
                              >
                                Edit object HTML + CSS
                              </button>
                            ) : null}
                            {onEditProjectDetails ? (
                              <button
                                className="project-webring__edit-details"
                                type="button"
                                onClick={() => onEditProjectDetails(selected)}
                              >
                                Edit project details
                              </button>
                            ) : selectedIsBuiltIn ? null : (
                              <a
                                className="project-webring__edit-details"
                                href="/showcase#your-submissions"
                              >
                                Edit project details
                              </a>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  ) : (
                    <div className="project-webring__welcome">
                      <h1>Building Benches for the Web</h1>
                      <p>
                        A class on creating public, social spaces for the web,
                        originally taught at{' '}
                        <a
                          href="https://sfpc.study"
                          target="_blank"
                          rel="noreferrer"
                        >
                          SFPC
                        </a>{' '}
                        in Summer 2026 by{' '}
                        <a
                          href="https://spencer.place"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Spencer Chang
                        </a>{' '}
                        and{' '}
                        <a
                          href="https://www.munusshih.com/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Munus Shih
                        </a>
                        {'. Learn more at '}
                        <a
                          href="https://class.playhtml.fun/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          class.playhtml.fun
                        </a>
                        {'.'}
                      </p>
                      <span>Tap an object to play · tap its name to visit</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {hasSynced && safeRingProjects.length > 0 ? (
        <div className="project-webring__zoom" aria-label="Playground zoom">
          <button
            aria-label="Zoom out"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => changeZoom(-ZOOM_STEP)}
            type="button"
          >
            −
          </button>
          <button
            aria-label="Reset zoom"
            className="project-webring__zoom-level"
            disabled={zoom === 1}
            onClick={() => setZoom(1)}
            type="button"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            aria-label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => changeZoom(ZOOM_STEP)}
            type="button"
          >
            +
          </button>
        </div>
      ) : null}

      {editing?.sharedObject && editorDraft ? (
        <aside
          className="project-webring__editor"
          aria-hidden={isPreviewMode}
          aria-label="Object editor"
          inert={isPreviewMode}
        >
          <header>
            <div>
              <p>Object code editor</p>
              <h2>{editing.title}</h2>
            </div>
            <button
              type="button"
              aria-label="Close object editor"
              onClick={closeEditor}
            >
              ×
            </button>
          </header>

          <div className="project-webring__editor-id">
            <span>Your permanent shared ID</span>
            <code>{editing.sharedObject.id}</code>
            <small>This ID cannot be edited or reused by another entry.</small>
          </div>

          <Suspense
            fallback={
              <div className="project-code-editor__loading" role="status">
                Opening code editor…
              </div>
            }
          >
            <ProjectCodeEditor
              css={editorDraft.css}
              html={editorDraft.html}
              onChange={updateDraft}
            />
          </Suspense>

          <div className="project-webring__editor-actions">
            <button
              className="project-webring__preview-object"
              disabled={!hasDraftChanges}
              onClick={previewDraft}
              type="button"
            >
              Preview
            </button>
            <button
              className="project-webring__save-object"
              disabled={!hasDraftChanges || !isCurrentDraftPreviewed}
              onClick={saveDraft}
              type="button"
            >
              Save changes
            </button>
            <span aria-live="polite">{editorStatus}</span>
          </div>

          <p className="project-webring__editor-live">
            {isBuiltInProjectId(editing.id)
              ? 'This is a permanent starter example. Previewing stays in your browser; saving publishes it for everyone. '
              : 'Previewing stays in your browser; saving publishes it to the shared room. '}
            The outer object always keeps <code>shared</code>,{' '}
            <code>can-toggle</code>, and <code>can-play</code>.
          </p>

          <div className="project-webring__editor-snippet">
            <div>
              <span>Connect something on your site</span>
              <button type="button" onClick={copyConnectionCode}>
                {copyStatus}
              </button>
            </div>
            <code>{sharedObjectConsumerSnippet(editing.sharedObject.id)}</code>
          </div>

          <button
            className="project-webring__reset-object"
            type="button"
            onClick={resetSharedObject}
          >
            Reset to the red stool
          </button>
        </aside>
      ) : null}

      {editing && editorDraft && isPreviewMode ? (
        <div className="project-webring__preview-bar" role="status">
          <div>
            <strong>Unsaved preview</strong>
            <span>Only you can see this version.</span>
          </div>
          <button type="button" onClick={() => setIsPreviewMode(false)}>
            Back to code
          </button>
          <button type="button" onClick={saveDraft}>
            Save preview
          </button>
        </div>
      ) : null}
    </div>
  );
}
