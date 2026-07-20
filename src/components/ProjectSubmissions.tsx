// ABOUTME: Domain-accessible student project submission form backed by a
// ABOUTME: canonical PlayHTML shared element rendered on the Showcase page.

import {
  usePlayContext,
  usePlayerIdentity,
  withSharedState,
} from '@playhtml/react';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type RefObject,
} from 'react';
import {
  createBuiltInProjects,
  createBuiltInReservedIds,
  createProjectAppearanceSharedObject,
  createSharedObjectId,
  DEFAULT_SHARED_OBJECT_HTML,
  isBuiltInProjectId,
  mergeBuiltInProjects,
  normalizeProjectSharedObject,
  projectFaviconUrl,
  sharedObjectConsumerSnippet,
} from '../lib/projectSharedObject';
import { ProjectEmojiPicker } from './ProjectEmojiPicker';
import { ProjectPlaygroundFrame } from './ProjectPlaygroundFrame';
import { type RingProject } from './ProjectWebring';

interface ProjectSubmission extends RingProject {
  id: string;
  name: string;
  submittedBy?: string;
  title: string;
  url: string;
  description?: string;
  emoji?: string;
  accentColor?: string;
  imageUrl?: string;
  submittedAt: number;
}

interface ProjectSubmissionData {
  projects: Record<string, ProjectSubmission>;
  reservedSharedIds?: Record<string, true>;
}

interface ProjectSubmissionsProps {
  adminMode?: boolean;
  variant: 'form' | 'showcase';
}

interface SubmitStatus {
  message: string;
  tone: 'error' | 'success';
}

const PROJECTS_ELEMENT_ID = 'student-projects';
const REGISTRY_DATA_EVENT = 'class-webring:registry-data';
const REGISTRY_DATA_REQUEST_EVENT = 'class-webring:request-data';
// Change this to "read-only" after the submission window closes.
const PROJECT_REGISTRY_PERMISSIONS = 'read-write' as const;
const MAX_NAME_LENGTH = 80;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 240;
const MAX_EMOJI_LENGTH = 12;
const DEFAULT_ACCENT_COLOR = '#f05a47';
const SUBMISSION_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function submissionDate(value: unknown): Date | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function projectDataSource(): string {
  return `${window.location.host}/showcase#${PROJECTS_ELEMENT_ID}`;
}

function normalizeProjectUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function ProjectAppearancePreview({
  accentColor,
  emoji,
  imageUrl,
  title,
  url,
}: {
  accentColor: string;
  emoji: string;
  imageUrl: string;
  title: string;
  url: string;
}) {
  const faviconUrl = projectFaviconUrl(url);
  const normalizedImageUrl = normalizeProjectUrl(imageUrl) ?? undefined;
  const imageSources = [faviconUrl, normalizedImageUrl].filter(
    (source, index, sources): source is string =>
      Boolean(source) && sources.indexOf(source) === index,
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [faviconUrl, normalizedImageUrl]);

  const imageSource = imageSources[sourceIndex];

  return (
    <div className="project-submissions__generated">
      <div
        className="project-submissions__generated-icon"
        style={{ '--preview-accent': accentColor } as CSSProperties}
      >
        <span aria-hidden="true">{emoji.trim() || '🪑'}</span>
        {imageSource ? (
          <img
            key={imageSource}
            src={imageSource}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setSourceIndex((current) => current + 1)}
          />
        ) : null}
      </div>
      <div>
        <h3>{title.trim() || 'Your project'} in the ring</h3>
        <p>
          This preview follows the same favicon, ring icon, then emoji order as
          the widget. Submitting also creates this as an editable shared object
          in the full-screen room.
        </p>
      </div>
    </div>
  );
}

export const ProjectSubmissions = withSharedState<
  ProjectSubmissionData,
  never,
  ProjectSubmissionsProps
>(
  ({ variant }) => ({
    defaultData: {
      projects: {},
      reservedSharedIds: createBuiltInReservedIds(),
    },
    id: PROJECTS_ELEMENT_ID,
    ...(variant === 'showcase'
      ? { shared: PROJECT_REGISTRY_PERMISSIONS }
      : { dataSource: projectDataSource() }),
  }),
  ({ data, setData, ref }, { adminMode = false, variant }) => {
    const { cursors, hasSynced } = usePlayContext();
    const { pid: playerId } = usePlayerIdentity();
    const builtInRegistryPrepared = useRef(false);
    const nameEdited = useRef(false);
    const [name, setName] = useState(() => cursors.name?.trim() ?? '');
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [emoji, setEmoji] = useState('🪑');
    const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
    const [imageUrl, setImageUrl] = useState('');
    const [editingProjectId, setEditingProjectId] = useState<string | null>(
      null,
    );
    const [status, setStatus] = useState<SubmitStatus | null>(null);

    useEffect(() => {
      const profileName = cursors.name?.trim();

      if (!nameEdited.current && profileName) {
        setName(profileName);
      }
    }, [cursors.name]);

    useEffect(() => {
      if (
        variant !== 'showcase' ||
        !hasSynced ||
        builtInRegistryPrepared.current
      )
        return;

      builtInRegistryPrepared.current = true;
      setData((draft) => {
        const builtInProjects = createBuiltInProjects();

        for (const id of Object.keys(draft.projects)) {
          if (id.startsWith('builtin-')) {
            delete draft.projects[id];
          }
        }

        draft.reservedSharedIds ??= {};
        for (const project of Object.values(builtInProjects)) {
          draft.reservedSharedIds[project.sharedObject.id] = true;
        }
      });
    }, [hasSynced, setData, variant]);

    useEffect(() => {
      const publishRegistryData = () => {
        const projects = mergeBuiltInProjects(data.projects);
        window.dispatchEvent(
          new CustomEvent(REGISTRY_DATA_EVENT, {
            detail: { data: { ...data, projects } },
          }),
        );
      };

      window.addEventListener(REGISTRY_DATA_REQUEST_EVENT, publishRegistryData);
      publishRegistryData();
      return () => {
        window.removeEventListener(
          REGISTRY_DATA_REQUEST_EVENT,
          publishRegistryData,
        );
      };
    }, [data]);

    const projectRecord: Record<string, ProjectSubmission> =
      mergeBuiltInProjects(
        data.projects && typeof data.projects === 'object'
          ? data.projects
          : undefined,
      );
    const projects = Object.values(projectRecord)
      .filter(
        (project) =>
          project &&
          typeof project === 'object' &&
          typeof project.id === 'string' &&
          typeof project.name === 'string' &&
          typeof project.title === 'string' &&
          Boolean(normalizeProjectUrl(project.url)),
      )
      .map((project) => ({
        ...project,
        id: project.id.slice(0, 100),
        name: project.name.slice(0, MAX_NAME_LENGTH),
        title: project.title.slice(0, MAX_TITLE_LENGTH),
        url: normalizeProjectUrl(project.url)!,
      }))
      .sort((left, right) => right.submittedAt - left.submittedAt);
    const myProjects = playerId
      ? projects.filter((project) => project.submittedBy === playerId)
      : [];
    const managedProjects = adminMode
      ? projects.filter((project) => !isBuiltInProjectId(project.id))
      : myProjects;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedName = name.trim();
      const trimmedTitle = title.trim();

      if (!trimmedName || !trimmedTitle || !url.trim()) {
        setStatus({
          message: 'Fill out the three fields marked *.',
          tone: 'error',
        });
        return;
      }

      const normalizedUrl = normalizeProjectUrl(url);

      if (!normalizedUrl) {
        setStatus({
          message: 'Enter a full http:// or https:// project URL.',
          tone: 'error',
        });
        return;
      }

      const normalizedImageUrl = imageUrl.trim()
        ? normalizeProjectUrl(imageUrl)
        : undefined;
      if (imageUrl.trim() && !normalizedImageUrl) {
        setStatus({
          message: 'The ring icon must be a full http:// or https:// URL.',
          tone: 'error',
        });
        return;
      }

      if (!hasSynced || !playerId) {
        setStatus({
          message: 'Your PlayHTML identity is still loading. Try again.',
          tone: 'error',
        });
        return;
      }

      const existingProject = editingProjectId
        ? managedProjects.find((project) => project.id === editingProjectId)
        : undefined;
      if (editingProjectId && !existingProject) {
        setStatus({
          message: adminMode
            ? 'This submission is no longer available.'
            : 'This submission no longer belongs to your PlayHTML identity.',
          tone: 'error',
        });
        return;
      }

      const projectId = existingProject?.id ?? crypto.randomUUID();
      const unavailableSharedIds = projects.map(
        (project) =>
          normalizeProjectSharedObject(project.sharedObject, project.id).id,
      );
      unavailableSharedIds.push(...Object.keys(data.reservedSharedIds ?? {}));
      const existingSharedObject = existingProject
        ? normalizeProjectSharedObject(
            existingProject.sharedObject,
            existingProject.id,
          )
        : undefined;
      const sharedId =
        existingSharedObject?.id ??
        createSharedObjectId(trimmedTitle, unavailableSharedIds);
      const normalizedEmoji = emoji.trim().slice(0, MAX_EMOJI_LENGTH) || '🪑';
      const sharedObject =
        existingSharedObject &&
        existingSharedObject.html !== DEFAULT_SHARED_OBJECT_HTML
          ? existingSharedObject
          : createProjectAppearanceSharedObject(sharedId, {
              accentColor,
              emoji: normalizedEmoji,
              imageUrl: normalizedImageUrl ?? undefined,
              title: trimmedTitle,
              url: normalizedUrl,
            });
      const submission: ProjectSubmission = {
        id: projectId,
        name: trimmedName.slice(0, MAX_NAME_LENGTH),
        submittedBy: existingProject ? existingProject.submittedBy : playerId,
        title: trimmedTitle.slice(0, MAX_TITLE_LENGTH),
        url: normalizedUrl,
        description: description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
        emoji: normalizedEmoji,
        accentColor,
        imageUrl: normalizedImageUrl ?? undefined,
        sharedObject,
        submittedAt: existingProject?.submittedAt ?? Date.now(),
      };

      setData((draft) => {
        draft.projects[submission.id] = submission;
        draft.reservedSharedIds ??= {};
        draft.reservedSharedIds[sharedObject.id] = true;
      });
      setTitle('');
      setUrl('');
      setDescription('');
      setEmoji('🪑');
      setAccentColor(DEFAULT_ACCENT_COLOR);
      setImageUrl('');
      setEditingProjectId(null);
      setStatus({
        message: existingProject
          ? 'Saved — your ring entry has been updated.'
          : 'Submitted — your project is live in the ring. Select it above to customize its HTML and CSS.',
        tone: 'success',
      });
    };

    const editProject = (project: ProjectSubmission) => {
      nameEdited.current = true;
      setEditingProjectId(project.id);
      setName(project.name);
      setTitle(project.title);
      setUrl(project.url);
      setDescription(project.description ?? '');
      setEmoji(project.emoji ?? '🪑');
      setAccentColor(project.accentColor ?? DEFAULT_ACCENT_COLOR);
      setImageUrl(project.imageUrl ?? '');
      setStatus(null);
      document.querySelector('#submit-project')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };

    const cancelEditing = () => {
      setEditingProjectId(null);
      setTitle('');
      setUrl('');
      setDescription('');
      setEmoji('🪑');
      setAccentColor(DEFAULT_ACCENT_COLOR);
      setImageUrl('');
      setStatus(null);
    };

    const removeProject = (project: ProjectSubmission) => {
      if (!adminMode && (!playerId || project.submittedBy !== playerId)) {
        setStatus({
          message: 'This submission does not belong to your PlayHTML identity.',
          tone: 'error',
        });
        return;
      }

      if (!window.confirm(`Remove “${project.title}” from the ring?`)) return;

      setData((draft) => {
        const currentProject = draft.projects[project.id];
        if (
          currentProject &&
          (adminMode || currentProject.submittedBy === playerId)
        ) {
          delete draft.projects[project.id];
        }
      });

      if (editingProjectId === project.id) {
        cancelEditing();
      }
      setStatus({
        message: 'Removed — the live ring will update automatically.',
        tone: 'success',
      });
    };

    return (
      <section
        ref={ref as RefObject<HTMLElement>}
        id={PROJECTS_ELEMENT_ID}
        className={`project-submissions project-submissions--${variant}`}
      >
        {variant === 'showcase' ? <ProjectPlaygroundFrame /> : null}

        <div className="project-submissions__form-panel" id="submit-project">
          <div className="project-submissions__intro">
            <p className="project-submissions__eyebrow">
              {editingProjectId ? 'Keep shaping it' : 'Add to the class'}
            </p>
            <h2 className="project-submissions__form-title">
              {editingProjectId ? 'Edit your project' : 'Submit your project'}
            </h2>
            <p className="project-submissions__form-copy">
              Fields marked <strong>*</strong> are required. Submitting adds
              your project to the ring and creates an editable shared object in
              the room above.
            </p>
          </div>

          <form
            className="project-submissions__form"
            noValidate
            onSubmit={handleSubmit}
          >
            <label className="project-submissions__field">
              <span className="project-submissions__label">
                Your name <span aria-hidden="true">*</span>
              </span>
              <input
                className="project-submissions__input"
                type="text"
                value={name}
                maxLength={MAX_NAME_LENGTH}
                autoComplete="name"
                placeholder="Ada Lovelace"
                required
                onChange={(event) => {
                  nameEdited.current = true;
                  setName(event.target.value);
                  setStatus(null);
                }}
              />
            </label>

            <label className="project-submissions__field">
              <span className="project-submissions__label">
                Project title <span aria-hidden="true">*</span>
              </span>
              <input
                className="project-submissions__input"
                type="text"
                value={title}
                maxLength={MAX_TITLE_LENGTH}
                placeholder="A bench for the web"
                required
                onChange={(event) => {
                  setTitle(event.target.value);
                  setStatus(null);
                }}
              />
            </label>

            <label className="project-submissions__field project-submissions__field--url">
              <span className="project-submissions__label">
                Project URL <span aria-hidden="true">*</span>
              </span>
              <input
                className="project-submissions__input"
                type="url"
                inputMode="url"
                value={url}
                placeholder="https://your-project.example"
                required
                onChange={(event) => {
                  setUrl(event.target.value);
                  setStatus(null);
                }}
              />
            </label>

            <label className="project-submissions__field project-submissions__field--wide">
              <span className="project-submissions__label">
                Short invitation
              </span>
              <textarea
                className="project-submissions__input project-submissions__textarea"
                value={description}
                maxLength={MAX_DESCRIPTION_LENGTH}
                placeholder="What kind of place are you inviting us into?"
                onChange={(event) => {
                  setDescription(event.target.value);
                  setStatus(null);
                }}
              />
            </label>

            <fieldset className="project-submissions__appearance">
              <legend className="project-submissions__section-label">
                Ring appearance
              </legend>
              <p className="project-submissions__appearance-copy">
                The ring tries your site&apos;s favicon first, then the ring
                icon URL. The emoji only appears if neither image loads.
              </p>
              <div className="project-submissions__field project-submissions__field--emoji">
                <span className="project-submissions__label">
                  Fallback emoji
                </span>
                <ProjectEmojiPicker value={emoji} onChange={setEmoji} />
              </div>
              <label className="project-submissions__field project-submissions__field--color">
                <span className="project-submissions__label">Glow color</span>
                <input
                  className="project-submissions__color"
                  type="color"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value)}
                />
              </label>
              <label className="project-submissions__field project-submissions__field--image">
                <span className="project-submissions__label">
                  Ring icon URL
                </span>
                <input
                  className="project-submissions__input"
                  type="url"
                  inputMode="url"
                  value={imageUrl}
                  placeholder="https://your-site.example/charm.png"
                  onChange={(event) => {
                    setImageUrl(event.target.value);
                    setStatus(null);
                  }}
                />
              </label>
            </fieldset>

            <ProjectAppearancePreview
              accentColor={accentColor}
              emoji={emoji}
              imageUrl={imageUrl}
              title={title}
              url={url}
            />

            <div className="project-submissions__actions">
              <button
                className="project-submissions__submit"
                disabled={!hasSynced || !playerId}
                type="submit"
              >
                {!hasSynced || !playerId
                  ? 'Connecting…'
                  : editingProjectId
                    ? 'Save changes'
                    : 'Submit project'}{' '}
                {hasSynced && playerId ? (
                  <span aria-hidden="true">→</span>
                ) : null}
              </button>
              {editingProjectId ? (
                <button
                  className="project-submissions__cancel"
                  type="button"
                  onClick={cancelEditing}
                >
                  Cancel editing
                </button>
              ) : null}
              <p
                className={
                  status
                    ? `project-submissions__status project-submissions__status--${status.tone}`
                    : 'project-submissions__status'
                }
                aria-live="polite"
              >
                {status?.message}
              </p>
            </div>
          </form>

          {adminMode || managedProjects.length > 0 ? (
            <div
              className={`project-submissions__mine${
                adminMode ? ' project-submissions__mine--admin' : ''
              }`}
              id="your-submissions"
            >
              <p className="project-submissions__mine-title">
                {adminMode ? 'Admin settings' : 'Your submissions'}
              </p>
              <p className="project-submissions__mine-copy">
                {adminMode
                  ? 'This is a soft-gated class control. Edit or remove any student entry below.'
                  : 'Return here with the same PlayHTML identity to change your project details, fallback emoji, glow color, or ring icon URL.'}
              </p>
              {managedProjects.length > 0 ? (
                <ul className="project-submissions__mine-list">
                  {managedProjects.map((project) => {
                    const sharedObject = normalizeProjectSharedObject(
                      project.sharedObject,
                      project.id,
                    );
                    const submittedAt = submissionDate(project.submittedAt);

                    return (
                      <li
                        className="project-submissions__mine-item"
                        key={project.id}
                      >
                        <a
                          className="project-submissions__mine-link"
                          href={project.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {project.title} <span aria-hidden="true">↗</span>
                        </a>
                        {adminMode ? (
                          <dl className="project-submissions__mine-submitter">
                            <div>
                              <dt>Submitted by</dt>
                              <dd>{project.name}</dd>
                            </div>
                            <div>
                              <dt>Submitted</dt>
                              <dd>
                                {submittedAt ? (
                                  <time dateTime={submittedAt.toISOString()}>
                                    {SUBMISSION_DATE_FORMAT.format(submittedAt)}
                                  </time>
                                ) : (
                                  'Date not recorded'
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>PlayHTML identity</dt>
                              <dd>
                                {project.submittedBy ? (
                                  <code>{project.submittedBy}</code>
                                ) : (
                                  'Identity not recorded'
                                )}
                              </dd>
                            </div>
                          </dl>
                        ) : null}
                        <div className="project-submissions__mine-id">
                          <span>Permanent shared ID</span>
                          <code>{sharedObject.id}</code>
                        </div>
                        <details className="project-submissions__mine-code">
                          <summary>Code for your website</summary>
                          <code>
                            {sharedObjectConsumerSnippet(sharedObject.id)}
                          </code>
                        </details>
                        <div className="project-submissions__mine-actions">
                          <button
                            className="project-submissions__edit"
                            type="button"
                            onClick={() => editProject(project)}
                          >
                            {adminMode
                              ? 'Edit entry'
                              : 'Edit project + thumbnail'}
                          </button>
                          <button
                            className="project-submissions__remove"
                            type="button"
                            onClick={() => removeProject(project)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="project-submissions__mine-empty">
                  No student submissions yet.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </section>
    );
  },
);
