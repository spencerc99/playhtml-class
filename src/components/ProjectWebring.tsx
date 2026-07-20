// ABOUTME: Full-viewport playground of class-hosted, participant-editable objects.
// ABOUTME: Every object publishes can-toggle and can-play state from a stable ID.

import { CanPlayElement } from '@playhtml/react';
import { TagType } from 'playhtml';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  DEFAULT_SHARED_OBJECT_HTML,
  defaultSharedObjectCss,
  normalizeProjectSharedObject,
  sharedObjectConsumerSnippet,
  type ProjectSharedObject,
} from '../lib/projectSharedObject';

export interface RingProject {
  accentColor?: string;
  description?: string;
  emoji?: string;
  id: string;
  imageUrl?: string;
  name: string;
  sharedObject?: ProjectSharedObject;
  submittedAt: number;
  submittedBy?: string;
  title: string;
  url: string;
}

interface ProjectWebringProps {
  demo?: boolean;
  hasSynced: boolean;
  onUpdateProject?: (
    projectId: string,
    sharedObject: ProjectSharedObject,
  ) => void;
  playerId?: string;
  projects: RingProject[];
}

const FALLBACK_COLORS = [
  '#f05a47',
  '#ffad42',
  '#7eae72',
  '#61a8bf',
  '#8976c9',
  '#df72a2',
];

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

function safeProjects(projects: RingProject[]): RingProject[] {
  return projects.flatMap((project, index) => {
    if (!project || typeof project !== 'object') return [];

    const url = safeHttpUrl(project.url);
    const title = safeText(project.title, 120);
    if (!url || !title) return [];

    const id = safeText(project.id, 100, `project-${index}`);

    return [
      {
        id,
        name: safeText(project.name, 80, 'someone'),
        title,
        url,
        description: safeText(project.description, 240) || undefined,
        emoji: safeText(project.emoji, 12, '🪑'),
        accentColor: safeColor(
          project.accentColor,
          FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        ),
        imageUrl: safeHttpUrl(project.imageUrl) ?? undefined,
        submittedAt:
          typeof project.submittedAt === 'number' ? project.submittedAt : index,
        submittedBy: safeText(project.submittedBy, 180) || undefined,
        sharedObject: normalizeProjectSharedObject(project.sharedObject, id),
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

function orbitPosition(index: number, total: number): CSSProperties {
  const maxPerOrbit = 16;
  const orbitIndex = Math.floor(index / maxPerOrbit);
  const itemIndex = index % maxPerOrbit;
  const itemsBeforeOrbit = orbitIndex * maxPerOrbit;
  const itemsInOrbit = Math.min(maxPerOrbit, total - itemsBeforeOrbit);
  const angle =
    (itemIndex / Math.max(itemsInOrbit, 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = Math.max(24, 46 - orbitIndex * 11);

  return {
    '--ring-x': `${50 + Math.cos(angle) * radius}%`,
    '--ring-y': `${50 + Math.sin(angle) * radius}%`,
    '--ring-delay': `${index * -0.12}s`,
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
  isSelected,
  onSelect,
  project,
}: {
  demo: boolean;
  isSelected: boolean;
  onSelect: () => void;
  project: RingProject;
}) {
  const sharedObject = project.sharedObject!;
  const node = (
    <div
      className={`project-webring__node${isSelected ? ' is-selected' : ''}`}
      id={sharedObject.id}
      role="button"
      tabIndex={0}
      aria-label={`Meet ${project.title} by ${project.name}`}
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
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
      ) : (
        <CanPlayElement<Record<string, unknown>>
          defaultData={{}}
          id={sharedObject.id}
          shared="read-write"
          tagInfo={[TagType.CanToggle, TagType.CanPlay]}
        >
          {() => node}
        </CanPlayElement>
      )}
    </>
  );
}

export function ProjectWebring({
  demo = false,
  hasSynced,
  onUpdateProject,
  playerId,
  projects,
}: ProjectWebringProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState('Copy connection code');
  const safeRingProjects = useMemo(() => safeProjects(projects), [projects]);
  const selected =
    safeRingProjects.find((project) => project.id === selectedId) ?? null;
  const editing =
    safeRingProjects.find((project) => project.id === editingId) ?? null;
  const canEditSelected = Boolean(
    selected &&
      onUpdateProject &&
      playerId &&
      selected.submittedBy === playerId,
  );

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
    }
  }, [editingId, safeRingProjects, selectedId]);

  useEffect(() => {
    setCopyStatus('Copy connection code');
  }, [editingId]);

  const updateSharedObject = (patch: Partial<ProjectSharedObject>) => {
    if (!editing?.sharedObject || !onUpdateProject) return;
    onUpdateProject(editing.id, { ...editing.sharedObject, ...patch });
  };

  const resetSharedObject = () => {
    if (!editing?.sharedObject) return;
    if (!window.confirm('Replace your current HTML and CSS with the red stool?'))
      return;

    updateSharedObject({
      html: DEFAULT_SHARED_OBJECT_HTML,
      css: defaultSharedObjectCss(editing.sharedObject.id),
    });
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
      }`}
      aria-label="Class project playground"
    >
      <div className="project-webring__wash" aria-hidden="true" />
      {safeRingProjects.length === 0 ? (
        <div className="project-webring__empty">
          <img src="/red-stool.png" alt="" />
          <h2>{hasSynced ? 'Take the first seat' : 'Gathering the stools…'}</h2>
          <p>
            {hasSynced
              ? 'The first submission will place a red stool in this shared room.'
              : 'Connecting to the shared class collection.'}
          </p>
        </div>
      ) : (
        <>
          <ol className="project-webring__orbit">
            {safeRingProjects.map((project, index) => {
              const accent =
                project.accentColor ??
                FALLBACK_COLORS[index % FALLBACK_COLORS.length];
              const nodeStyle = {
                ...orbitPosition(index, safeRingProjects.length),
                '--ring-accent': accent,
              } as CSSProperties;

              return (
                <li
                  className={`project-webring__item${
                    selectedId === project.id ? ' is-selected' : ''
                  }`}
                  key={project.id}
                  style={nodeStyle}
                >
                  <ObjectNode
                    demo={demo}
                    isSelected={selectedId === project.id}
                    onSelect={() => setSelectedId(project.id)}
                    project={project}
                  />
                  <span className="project-webring__node-label">
                    {project.name}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="project-webring__center" aria-live="polite">
            {selected ? (
              <article
                className="project-webring__detail"
                style={
                  {
                    '--ring-accent': selected.accentColor ?? '#e00000',
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
                  A web place by {selected.name}
                </p>
                <h2>{selected.title}</h2>
                {selected.description ? <p>{selected.description}</p> : null}
                <code className="project-webring__shared-id">
                  id=&quot;{selected.sharedObject?.id}&quot;
                </code>
                <a href={selected.url} target="_blank" rel="noreferrer">
                  Enter {projectHostname(selected.url)}{' '}
                  <span aria-hidden="true">↗</span>
                </a>
                {canEditSelected ? (
                  <button
                    className="project-webring__edit-object"
                    type="button"
                    onClick={() => setEditingId(selected.id)}
                  >
                    Edit this object
                  </button>
                ) : null}
              </article>
            ) : (
              <div className="project-webring__welcome">
                <p>A shared room built by the class</p>
                <h1>Benches for the Internet</h1>
                <span>Choose a stool to meet its website</span>
              </div>
            )}
          </div>
        </>
      )}

      {editing?.sharedObject ? (
        <aside className="project-webring__editor" aria-label="Object editor">
          <header>
            <div>
              <p>Live object editor</p>
              <h2>{editing.title}</h2>
            </div>
            <button
              type="button"
              aria-label="Close object editor"
              onClick={() => setEditingId(null)}
            >
              ×
            </button>
          </header>

          <div className="project-webring__editor-id">
            <span>Your permanent shared ID</span>
            <code>{editing.sharedObject.id}</code>
            <small>This ID cannot be edited or reused by another entry.</small>
          </div>

          <label>
            <span>HTML</span>
            <textarea
              value={editing.sharedObject.html}
              spellCheck={false}
              onChange={(event) =>
                updateSharedObject({ html: event.target.value })
              }
            />
          </label>

          <label>
            <span>CSS</span>
            <textarea
              value={editing.sharedObject.css}
              spellCheck={false}
              onChange={(event) =>
                updateSharedObject({ css: event.target.value })
              }
            />
          </label>

          <p className="project-webring__editor-live">
            Changes save to the class registry and appear live. The outer
            object always keeps <code>shared</code>, <code>can-toggle</code>, and{' '}
            <code>can-play</code>.
          </p>

          <div className="project-webring__editor-snippet">
            <div>
              <span>Connect something on your site</span>
              <button type="button" onClick={copyConnectionCode}>
                {copyStatus}
              </button>
            </div>
            <code>
              {sharedObjectConsumerSnippet(editing.sharedObject.id)}
            </code>
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

      <a
        className="project-webring__skip"
        href="/showcase#submit-project"
        target="_top"
      >
        Add your place ↓
      </a>
    </div>
  );
}
