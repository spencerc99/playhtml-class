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
import { ProjectWebring, type RingProject } from './ProjectWebring';

interface ProjectSubmission extends RingProject {
  id: string;
  name: string;
  submittedBy?: string;
  title: string;
  url: string;
  category?: ProjectCategory;
  description?: string;
  emoji?: string;
  accentColor?: string;
  imageUrl?: string;
  sharedElement?: {
    dataSource: string;
  };
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
const MAX_DESCRIPTION_LENGTH = 240;
const MAX_EMOJI_LENGTH = 12;
const DEFAULT_ACCENT_COLOR = '#f05a47';
const PROJECT_CATEGORIES = [
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'experiments', label: 'Experiments' },
  { value: 'web-benches', label: 'Web benches' },
] as const;

type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]['value'];

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

function normalizeSharedElement(
  pageUrl: string,
  elementId: string,
): ProjectSubmission['sharedElement'] | null {
  if (!pageUrl.trim() && !elementId.trim()) return undefined;
  if (!pageUrl.trim() || !elementId.trim()) return null;
  if (!/^[A-Za-z][\w.:-]{0,79}$/.test(elementId.trim())) return null;

  const normalizedPage = normalizeProjectUrl(pageUrl);
  if (!normalizedPage) return null;

  const source = new URL(normalizedPage);
  const path =
    source.pathname === '/' ? '' : source.pathname.replace(/\/$/, '');

  return {
    dataSource: `${source.host}${path}#${elementId.trim()}`,
  };
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
    const [description, setDescription] = useState('');
    const [emoji, setEmoji] = useState('🌱');
    const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
    const [imageUrl, setImageUrl] = useState('');
    const [sharedPageUrl, setSharedPageUrl] = useState('');
    const [sharedElementId, setSharedElementId] = useState('');
    const [status, setStatus] = useState<SubmitStatus | null>(null);

    useEffect(() => {
      const profileName = cursors.name?.trim();

      if (!nameEdited.current && profileName) {
        setName(profileName);
      }
    }, [cursors.name]);

    const projectRecord =
      data.projects && typeof data.projects === 'object' ? data.projects : {};
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

      const normalizedImageUrl = imageUrl.trim()
        ? normalizeProjectUrl(imageUrl)
        : undefined;
      if (imageUrl.trim() && !normalizedImageUrl) {
        setStatus({
          message: 'The circle image must be a full http:// or https:// URL.',
          tone: 'error',
        });
        return;
      }

      const sharedElement = normalizeSharedElement(
        sharedPageUrl,
        sharedElementId,
      );
      if (sharedElement === null) {
        setStatus({
          message:
            'To connect a shared element, include both its page URL and a simple stable ID.',
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
        description: description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
        emoji: emoji.trim().slice(0, MAX_EMOJI_LENGTH) || '🌱',
        accentColor,
        imageUrl: normalizedImageUrl ?? undefined,
        sharedElement,
        submittedAt: Date.now(),
      };

      setData((draft) => {
        draft.projects[submission.id] = submission;
      });
      setTitle('');
      setUrl('');
      setCategory('');
      setDescription('');
      setEmoji('🌱');
      setAccentColor(DEFAULT_ACCENT_COLOR);
      setImageUrl('');
      setSharedPageUrl('');
      setSharedElementId('');
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
          <ProjectWebring hasSynced={hasSynced} projects={projects} />
        ) : null}

        <div className="project-submissions__form-panel" id="submit-project">
          <div className="project-submissions__intro">
            <p className="project-submissions__eyebrow">Add to the class</p>
            <h2 className="project-submissions__form-title">
              Submit your project
            </h2>
            <p className="project-submissions__form-copy">
              Share your live URL, then give its circle a tiny personality. All
              entries are rendered as safe data—never as submitted code.
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
                Your circle
              </legend>
              <label className="project-submissions__field project-submissions__field--emoji">
                <span className="project-submissions__label">Emoji</span>
                <input
                  className="project-submissions__input"
                  type="text"
                  value={emoji}
                  maxLength={MAX_EMOJI_LENGTH}
                  onChange={(event) => setEmoji(event.target.value)}
                />
              </label>
              <label className="project-submissions__field project-submissions__field--color">
                <span className="project-submissions__label">Glow</span>
                <input
                  className="project-submissions__color"
                  type="color"
                  value={accentColor}
                  onChange={(event) => setAccentColor(event.target.value)}
                />
              </label>
              <label className="project-submissions__field project-submissions__field--image">
                <span className="project-submissions__label">
                  Circle image URL (optional)
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

            <fieldset className="project-submissions__shared">
              <legend className="project-submissions__section-label">
                Live-link an element <span>optional</span>
              </legend>
              <p className="project-submissions__shared-copy">
                The circle image above becomes the shared element in our ring.
                Connect it to an element on your site using one shared
                <code>{` { active } `}</code>value, then make the active state
                look and behave however you want on your own site.
              </p>
              <label className="project-submissions__field project-submissions__field--shared-url">
                <span className="project-submissions__label">
                  Element page URL
                </span>
                <input
                  className="project-submissions__input"
                  type="url"
                  inputMode="url"
                  value={sharedPageUrl}
                  placeholder={url || 'https://your-project.example'}
                  onChange={(event) => {
                    setSharedPageUrl(event.target.value);
                    setStatus(null);
                  }}
                />
              </label>
              <label className="project-submissions__field">
                <span className="project-submissions__label">
                  Stable element ID
                </span>
                <input
                  className="project-submissions__input"
                  type="text"
                  value={sharedElementId}
                  maxLength={80}
                  placeholder="my-ring-charm"
                  onChange={(event) => {
                    setSharedElementId(event.target.value);
                    setStatus(null);
                  }}
                />
              </label>
              {sharedElementId ? (
                <div className="project-submissions__snippet">
                  <span>Paste this into your site:</span>
                  <code>{`<img id="${sharedElementId}" shared can-play src="/your-image.png" alt="" />
<script type="module">
  import { playhtml } from "https://unpkg.com/playhtml";

  const charm = document.querySelector("#${sharedElementId}");
  charm.defaultData = { active: false };
  charm.onClick = (_event, { setData }) => {
    setData((draft) => { draft.active = !draft.active; });
  };
  charm.updateElement = ({ element, data }) => {
    element.classList.toggle("is-active", data.active);
  };

  playhtml.init();
</script>`}</code>
                  <small>
                    Replace the example image with your own element. Customize
                    <code>.is-active</code> with any CSS or script you want. The
                    class site receives only the boolean state, never your code.
                  </small>
                </div>
              ) : null}
            </fieldset>

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
