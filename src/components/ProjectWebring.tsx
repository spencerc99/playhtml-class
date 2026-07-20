// ABOUTME: Full-viewport, responsive orbit built from submitted class projects.
// ABOUTME: Optional PlayHTML consumers mirror safe built-in behaviors from student sites.

import {
  CanGrowElement,
  CanHoverElement,
  CanMoveElement,
  CanSpinElement,
  CanToggleElement,
} from '@playhtml/react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';

export type RingCapability = 'grow' | 'hover' | 'move' | 'spin' | 'toggle';

export interface RingProject {
  id: string;
  name: string;
  title: string;
  url: string;
  category?: string;
  description?: string;
  emoji?: string;
  accentColor?: string;
  imageUrl?: string;
  submittedAt: number;
  sharedElement?: {
    capability?: RingCapability;
    dataSource: string;
  };
}

interface ProjectWebringProps {
  hasSynced: boolean;
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

function safeSharedElement(value: unknown): RingProject['sharedElement'] {
  if (!value || typeof value !== 'object') return undefined;

  const candidate = value as Record<string, unknown>;
  const capability = candidate.capability;
  const dataSource = candidate.dataSource;
  const safeCapability: RingCapability =
    capability === 'spin' ||
    capability === 'grow' ||
    capability === 'hover' ||
    capability === 'move'
      ? capability
      : 'toggle';
  const validDataSource =
    typeof dataSource === 'string' &&
    /^[\w.-]+(?::\d+)?(?:\/[^\s#]*)?#[A-Za-z][\w.:-]{0,79}$/.test(dataSource);

  return validDataSource
    ? { capability: safeCapability, dataSource }
    : undefined;
}

function safeProjects(projects: RingProject[]): RingProject[] {
  return projects.flatMap((project, index) => {
    if (!project || typeof project !== 'object') return [];

    const url = safeHttpUrl(project.url);
    const title = safeText(project.title, 120);
    if (!url || !title) return [];

    return [
      {
        id: safeText(project.id, 100, `project-${index}`),
        name: safeText(project.name, 80, 'someone'),
        title,
        url,
        category: safeText(project.category, 40) || undefined,
        description: safeText(project.description, 240) || undefined,
        emoji: safeText(project.emoji, 12, '✦'),
        accentColor: safeColor(
          project.accentColor,
          FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        ),
        imageUrl: safeHttpUrl(project.imageUrl) ?? undefined,
        submittedAt:
          typeof project.submittedAt === 'number' ? project.submittedAt : index,
        sharedElement: safeSharedElement(project.sharedElement),
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

function projectImage(project: RingProject): string {
  const imageUrl = safeHttpUrl(project.imageUrl);
  if (imageUrl) return imageUrl;

  try {
    const projectUrl = safeHttpUrl(project.url);
    return projectUrl ? new URL('/favicon.ico', projectUrl).href : '';
  } catch {
    return '';
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
    '--ring-angle': `${angle}rad`,
    '--ring-x': `${50 + Math.cos(angle) * radius}%`,
    '--ring-y': `${50 + Math.sin(angle) * radius}%`,
    '--ring-delay': `${index * -0.12}s`,
  } as CSSProperties;
}

function RingNode({
  isSelected,
  onSelect,
  project,
}: {
  isSelected: boolean;
  onSelect: () => void;
  project: RingProject;
}) {
  const renderNode = (active: boolean) => (
    <button
      id={`ring-node-${project.id}`}
      className={`project-webring__node${active ? ' is-active' : ''}`}
      type="button"
      aria-label={`Meet ${project.title} by ${project.name}`}
      aria-pressed={active}
      onClick={onSelect}
    >
      <span className="project-webring__node-fallback" aria-hidden="true">
        {project.emoji || '✦'}
      </span>
      {projectImage(project) ? (
        <img
          className="project-webring__node-image"
          src={projectImage(project)}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
      {isSelected ? (
        <span className="sr-only">Project details open</span>
      ) : null}
    </button>
  );

  if (!project.sharedElement) return renderNode(false);

  if (project.sharedElement.capability === 'spin') {
    return (
      <CanSpinElement dataSource={project.sharedElement.dataSource}>
        {renderNode(false)}
      </CanSpinElement>
    );
  }

  if (project.sharedElement.capability === 'grow') {
    return (
      <CanGrowElement dataSource={project.sharedElement.dataSource}>
        {renderNode(false)}
      </CanGrowElement>
    );
  }

  if (project.sharedElement.capability === 'hover') {
    return (
      <CanHoverElement dataSource={project.sharedElement.dataSource}>
        {renderNode(false)}
      </CanHoverElement>
    );
  }

  if (project.sharedElement.capability === 'move') {
    return (
      <CanMoveElement dataSource={project.sharedElement.dataSource}>
        {renderNode(false)}
      </CanMoveElement>
    );
  }

  return (
    <CanToggleElement dataSource={project.sharedElement.dataSource}>
      {({ data }) => renderNode(Boolean(data.on))}
    </CanToggleElement>
  );
}

export function ProjectWebring({ hasSynced, projects }: ProjectWebringProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const safeRingProjects = useMemo(() => safeProjects(projects), [projects]);
  const selected =
    safeRingProjects.find((project) => project.id === selectedId) ?? null;

  useEffect(() => {
    if (
      selectedId &&
      !safeRingProjects.some((project) => project.id === selectedId)
    ) {
      setSelectedId(null);
    }
  }, [safeRingProjects, selectedId]);

  return (
    <div
      className={`project-webring${selected ? ' project-webring--expanded' : ''}`}
      aria-label="Class project web ring"
    >
      <div className="project-webring__wash" aria-hidden="true" />
      {safeRingProjects.length === 0 ? (
        <div className="project-webring__empty">
          <span aria-hidden="true">✦</span>
          <h2>{hasSynced ? 'Begin the ring' : 'Gathering the ring…'}</h2>
          <p>
            {hasSynced
              ? 'The first submitted project will become our first little world.'
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
                  <RingNode
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
                <span
                  className="project-webring__detail-emoji"
                  aria-hidden="true"
                >
                  {selected.emoji || '✦'}
                </span>
                <p className="project-webring__detail-kicker">
                  A web place by {selected.name}
                </p>
                <h2>{selected.title}</h2>
                {selected.description ? <p>{selected.description}</p> : null}
                <a href={selected.url} target="_blank" rel="noreferrer">
                  Enter {projectHostname(selected.url)}{' '}
                  <span aria-hidden="true">↗</span>
                </a>
                {selected.sharedElement ? (
                  <small>
                    This charm is live-linked to their site. Try touching it.
                  </small>
                ) : null}
              </article>
            ) : (
              <div className="project-webring__welcome">
                <p>Built by the class</p>
                <h1>Our web ring</h1>
                <span>Choose a little world to expand it</span>
                <strong>{safeRingProjects.length} places connected</strong>
              </div>
            )}
          </div>
        </>
      )}
      <a className="project-webring__skip" href="#submit-project">
        Add your place ↓
      </a>
    </div>
  );
}
