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

type ClassSection = 'monday' | 'tuesday';

interface ProjectSubmission {
  id: string;
  name: string;
  title: string;
  url: string;
  section: ClassSection;
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

function sectionLabel(section: ClassSection): string {
  return section === 'monday' ? 'Monday' : 'Tuesday';
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
    const { cursors, hasSynced } = usePlayContext();
    const nameEdited = useRef(false);
    const [name, setName] = useState(() => cursors.name?.trim() ?? '');
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [section, setSection] = useState<ClassSection | ''>('');
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

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedName = name.trim();
      const trimmedTitle = title.trim();

      if (!trimmedName || !trimmedTitle || !url.trim() || !section) {
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

      const submission: ProjectSubmission = {
        id: crypto.randomUUID(),
        name: trimmedName.slice(0, MAX_NAME_LENGTH),
        title: trimmedTitle.slice(0, MAX_TITLE_LENGTH),
        url: normalizedUrl,
        section,
        submittedAt: Date.now(),
      };

      setData((draft) => {
        draft.projects[submission.id] = submission;
      });
      setTitle('');
      setUrl('');
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
              <div className="project-submissions__grid">
                {projects.map((project) => (
                  <article
                    key={project.id}
                    className="project-submissions__card"
                  >
                    <span
                      className={`project-submissions__badge project-submissions__badge--${project.section}`}
                    >
                      {sectionLabel(project.section)}
                    </span>
                    <h2 className="project-submissions__card-title">
                      {project.title}
                    </h2>
                    <p className="project-submissions__student">
                      by {project.name}
                    </p>
                    <a
                      className="project-submissions__link"
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit project <span aria-hidden="true">↗</span>
                    </a>
                  </article>
                ))}
              </div>
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

            <label className="project-submissions__field">
              <span className="project-submissions__label">Class section</span>
              <select
                className="project-submissions__input project-submissions__select"
                value={section}
                required
                onChange={(event) => {
                  setSection(event.target.value as ClassSection | '');
                  setStatus(null);
                }}
              >
                <option value="">Choose a section</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
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
        </div>
      </section>
    );
  },
);
