// ABOUTME: Domain-accessible student project submission form backed by a
// ABOUTME: canonical PlayHTML shared element rendered on the Showcase page.

import { usePlayContext, withSharedState } from '@playhtml/react';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react';

interface ProjectSubmission {
  id: string;
  name: string;
  submittedBy?: string;
  title: string;
  url: string;
  category?: ProjectCategory;
  submittedAt: number;
}

interface ProjectSubmissionData {
  projects: Record<string, ProjectSubmission>;
}

interface ProjectSubmissionsProps {
  variant: 'form' | 'showcase';
}

interface SubmitStatus {
  message: string;
  tone: 'error' | 'success';
}

const PROJECTS_ELEMENT_ID = 'student-projects';
const MAX_NAME_LENGTH = 80;
const MAX_TITLE_LENGTH = 120;
const PROJECT_CATEGORIES = [
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'experiments', label: 'Experiments' },
  { value: 'web-benches', label: 'Web benches' },
] as const;

type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]['value'];

function projectCategoryLabel(category?: ProjectCategory): string {
  return (
    PROJECT_CATEGORIES.find((option) => option.value === category)?.label ??
    'Experiments'
  );
}

function projectHostname(projectUrl: string): string {
  try {
    return new URL(projectUrl).hostname.replace(/^www\./, '');
  } catch {
    return projectUrl;
  }
}

function projectFaviconUrl(projectUrl: string): string {
  return new URL('/favicon.ico', projectUrl).href;
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

export const ProjectSubmissions = withSharedState<
  ProjectSubmissionData,
  never,
  ProjectSubmissionsProps
>(
  ({ variant }) => ({
    defaultData: { projects: {} },
    id: PROJECTS_ELEMENT_ID,
    ...(variant === 'showcase'
      ? { shared: 'read-write' }
      : { dataSource: projectDataSource() }),
  }),
  ({ data, setData, ref }, { variant }) => {
    const { cursors, getMyPlayerIdentity, hasSynced } = usePlayContext();
    const nameEdited = useRef(false);
    const [name, setName] = useState(() => cursors.name?.trim() ?? '');
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [category, setCategory] = useState<ProjectCategory | ''>('');
    const [status, setStatus] = useState<SubmitStatus | null>(null);

    useEffect(() => {
      const profileName = cursors.name?.trim();

      if (!nameEdited.current && profileName) {
        setName(profileName);
      }
    }, [cursors.name]);

    const projects = Object.values(data.projects).sort(
      (left, right) => right.submittedAt - left.submittedAt,
    );
    const playerId = getMyPlayerIdentity()?.publicKey;
    const myProjects = playerId
      ? projects.filter((project) => project.submittedBy === playerId)
      : [];

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedName = name.trim();
      const trimmedTitle = title.trim();

      if (!trimmedName || !trimmedTitle || !url.trim() || !category) {
        setStatus({
          message: 'Fill out every field before submitting.',
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

      if (!playerId) {
        setStatus({
          message: 'Your PlayHTML identity is still loading. Try again.',
          tone: 'error',
        });
        return;
      }

      const submission: ProjectSubmission = {
        id: crypto.randomUUID(),
        name: trimmedName.slice(0, MAX_NAME_LENGTH),
        submittedBy: playerId,
        title: trimmedTitle.slice(0, MAX_TITLE_LENGTH),
        url: normalizedUrl,
        category,
        submittedAt: Date.now(),
      };

      setData((draft) => {
        draft.projects[submission.id] = submission;
      });
      setTitle('');
      setUrl('');
      setCategory('');
      setStatus({
        message: 'Submitted — your project is now in the Showcase.',
        tone: 'success',
      });
    };

    return (
      <section
        ref={ref as RefObject<HTMLElement>}
        id={PROJECTS_ELEMENT_ID}
        className={`project-submissions project-submissions--${variant}`}
      >
        {variant === 'showcase' ? (
          <div className="project-submissions__collection">
            {projects.length === 0 ? (
              <p className="project-submissions__empty">
                {hasSynced
                  ? 'No projects yet — submit the first one below.'
                  : 'Loading projects…'}
              </p>
            ) : (
              <ul className="project-submissions__list">
                {projects.map((project) => (
                  <li key={project.id} className="project-submissions__card">
                    <a
                      className="project-submissions__card-link"
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="project-submissions__card-preview">
                        <span
                          className="project-submissions__card-fallback"
                          aria-hidden="true"
                        >
                          {projectHostname(project.url).charAt(0).toUpperCase()}
                        </span>
                        <img
                          className="project-submissions__card-favicon"
                          src={projectFaviconUrl(project.url)}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                        />
                        <span className="project-submissions__card-host">
                          {projectHostname(project.url)}
                        </span>
                      </span>
                      <span className="project-submissions__card-body">
                        <span className="project-submissions__card-category">
                          {projectCategoryLabel(project.category)}
                        </span>
                        <span className="project-submissions__card-heading">
                          <span className="project-submissions__card-title">
                            {project.title}
                          </span>
                          <span
                            className="project-submissions__card-arrow"
                            aria-hidden="true"
                          >
                            ↗
                          </span>
                        </span>
                        <span className="project-submissions__card-student">
                          by {project.name}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        <div className="project-submissions__form-panel">
          <div className="project-submissions__intro">
            <p className="project-submissions__eyebrow">Add to the class</p>
            <h2 className="project-submissions__form-title">
              Submit your project
            </h2>
            <p className="project-submissions__form-copy">
              Share the live URL so everyone can visit what you made.
            </p>
          </div>

          <form
            className="project-submissions__form"
            noValidate
            onSubmit={handleSubmit}
          >
            <label className="project-submissions__field">
              <span className="project-submissions__label">Your name</span>
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
              <span className="project-submissions__label">Project title</span>
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
              <span className="project-submissions__label">Project URL</span>
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

            <label className="project-submissions__field project-submissions__field--category">
              <span className="project-submissions__label">Category</span>
              <select
                className="project-submissions__input project-submissions__select"
                value={category}
                required
                onChange={(event) => {
                  setCategory(event.target.value as ProjectCategory | '');
                  setStatus(null);
                }}
              >
                <option value="" disabled>
                  Choose a category
                </option>
                {PROJECT_CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="project-submissions__actions">
              <button className="project-submissions__submit" type="submit">
                Submit project <span aria-hidden="true">→</span>
              </button>
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

          {myProjects.length > 0 ? (
            <div className="project-submissions__mine">
              <p className="project-submissions__mine-title">
                Your submissions
              </p>
              <ul className="project-submissions__mine-list">
                {myProjects.map((project) => (
                  <li key={project.id}>
                    <a
                      className="project-submissions__mine-link"
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {project.title} <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    );
  },
);
