// ABOUTME: Connects the fullscreen object playground to the Showcase registry.
// ABOUTME: Owners can update their hosted object's HTML and CSS from the ring.

import { playhtml, usePlayContext, withSharedState } from '@playhtml/react';
import { type RefObject } from 'react';
import {
  createBuiltInReservedIds,
  DEFAULT_SHARED_OBJECT_HTML,
  defaultSharedObjectCss,
  isBuiltInProjectId,
  mergeBuiltInProjects,
  normalizeProjectSharedObject,
  type ProjectSharedObject,
} from '../lib/projectSharedObject';
import { ProjectWebring, type RingProject } from './ProjectWebring';

interface ProjectRegistryData {
  projects: Record<string, RingProject>;
  reservedSharedIds?: Record<string, true>;
}

interface ProjectPlaygroundProps {
  demo?: boolean;
  embedded?: boolean;
}

const DEMO_NAMES = [
  'Mina',
  'Jun',
  'Ari',
  'Sol',
  'Inez',
  'Bo',
  'Luz',
  'Mori',
  'Nia',
  'Paz',
  'Rae',
  'Tao',
  'Uma',
  'Vale',
  'Wren',
  'Xio',
  'Yara',
  'Zed',
  'Ayo',
  'Bela',
  'Cleo',
  'Dara',
  'Eli',
  'Fia',
  'Geo',
  'Hana',
  'Io',
  'Jae',
  'Koa',
  'Lio',
];

function projectDataSource(): string {
  return `${window.location.host}/showcase#student-projects`;
}

function makeDemoProjects(): RingProject[] {
  return DEMO_NAMES.map((name, index) => {
    const id = `demo-project-${index + 1}`;
    const sharedId = `bench-demo-${index + 1}`;

    return {
      id,
      name,
      title: `Internet place ${index + 1}`,
      url: `https://example.com/place-${index + 1}`,
      accentColor: ['#f05a47', '#ffad42', '#7eae72', '#61a8bf'][index % 4],
      submittedAt: index + 1,
      sharedObject: {
        id: sharedId,
        html: DEFAULT_SHARED_OBJECT_HTML,
        css: defaultSharedObjectCss(sharedId),
      },
    };
  });
}

const DEMO_PROJECTS = makeDemoProjects();

export const ProjectPlayground = withSharedState<
  ProjectRegistryData,
  never,
  ProjectPlaygroundProps
>(
  ({ demo }) => ({
    defaultData: {
      projects: {},
      reservedSharedIds: createBuiltInReservedIds(),
    },
    id: demo ? 'demo-projects' : 'playground-projects',
    ...(demo ? {} : { dataSource: projectDataSource() }),
  }),
  ({ data, setData, ref }, { demo = false, embedded = false }) => {
    const { getMyPlayerIdentity, hasSynced } = usePlayContext();
    const playerId =
      getMyPlayerIdentity()?.publicKey ??
      (hasSynced ? playhtml.presence.getMyIdentity().publicKey : undefined);
    const projectRecord = mergeBuiltInProjects(
      data.projects && typeof data.projects === 'object'
        ? data.projects
        : undefined,
    );
    const projects = demo ? DEMO_PROJECTS : Object.values(projectRecord);

    const updateProject = (
      projectId: string,
      patch: Partial<Pick<ProjectSharedObject, 'css' | 'html'>>,
    ) => {
      if (demo || embedded) return;

      setData((draft) => {
        const project = draft.projects[projectId];
        if (
          !project ||
          (!isBuiltInProjectId(projectId) &&
            (!playerId || project.submittedBy !== playerId))
        )
          return;
        project.sharedObject = {
          ...normalizeProjectSharedObject(project.sharedObject, project.id),
          ...patch,
        };
      });
    };

    return (
      <div
        className="project-playground"
        ref={ref as RefObject<HTMLDivElement>}
      >
        <ProjectWebring
          demo={demo}
          embedded={embedded}
          hasSynced={demo || hasSynced}
          onUpdateProject={demo ? undefined : updateProject}
          playerId={playerId}
          projects={projects}
        />
      </div>
    );
  },
);
